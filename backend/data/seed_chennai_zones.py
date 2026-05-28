"""
Seed script — generates Chennai road zones from OpenStreetMap using osmnx.
Converts road edges to a 500m grid and inserts into road_zones table.

Usage:
    python -m data.seed_chennai_zones
"""
import os
import uuid
import psycopg2
import osmnx as ox
import geopandas as gpd
from shapely.geometry import box as shapely_box

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://sentinel:sentinel123@localhost/sentinelai")


def create_500m_grid(gdf: gpd.GeoDataFrame, cell_size_deg: float = 0.0045):
    """
    Overlay a regular grid over the road network bounding box.
    0.0045 degrees ≈ 500m at Chennai's latitude.
    """
    bounds = gdf.total_bounds  # (minx, miny, maxx, maxy)
    minx, miny, maxx, maxy = bounds

    cells = []
    x = minx
    while x < maxx:
        y = miny
        while y < maxy:
            cell = shapely_box(x, y, x + cell_size_deg, y + cell_size_deg)
            cells.append(cell)
            y += cell_size_deg
        x += cell_size_deg

    grid = gpd.GeoDataFrame(geometry=cells, crs="EPSG:4326")
    # Only keep cells that intersect the road network
    joined = gpd.sjoin(grid, gdf[["geometry"]], how="inner", predicate="intersects")
    return joined.drop_duplicates(subset="geometry").reset_index(drop=True)


def seed_zones():
    print("Fetching Chennai road network from OSM…")
    G = ox.graph_from_place("Chennai, India", network_type="drive")
    edges = ox.graph_to_gdfs(G, nodes=False, edges=True)

    print("Generating 500m grid cells…")
    grid = create_500m_grid(edges)
    print(f"  → {len(grid)} grid cells generated")

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    inserted = 0
    for i, row in grid.iterrows():
        zone_id = str(uuid.uuid4())
        geom_wkt = row.geometry.wkt
        cur.execute(
            """
            INSERT INTO road_zones (id, zone_name, geom, city, road_type, api_score, risk_category)
            VALUES (%s, %s, ST_GeomFromText(%s, 4326), %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
            """,
            (zone_id, f"Chennai Zone {i+1}", geom_wkt, "Chennai", "arterial", 0.0, "Low"),
        )
        inserted += 1

    conn.commit()
    cur.close()
    conn.close()
    print(f"✅ Inserted {inserted} road zones into DB")


if __name__ == "__main__":
    seed_zones()
