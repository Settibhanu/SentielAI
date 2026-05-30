"""
SENTINEL SOS — Emergency Contacts Routes.

GET    /api/emergency-contacts
POST   /api/emergency-contacts
PUT    /api/emergency-contacts/{id}
DELETE /api/emergency-contacts/{id}

Note: Auth is simplified — uses X-User-ID header for demo.
In production, replace with JWT authentication.
"""
import logging
import uuid
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.db_models import EmergencyContact, User
from app.schemas.pydantic_schemas import (
    EmergencyContactCreate,
    EmergencyContactUpdate,
    EmergencyContactSchema,
)

router = APIRouter()
logger = logging.getLogger(__name__)


async def get_or_create_user(user_id_header: Optional[str], db: AsyncSession) -> User:
    """Get or create a user from the X-User-ID header."""
    if not user_id_header:
        # Create anonymous user for demo
        user = User(name="Anonymous User")
        db.add(user)
        await db.flush()
        return user

    try:
        uid = UUID(user_id_header)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid X-User-ID format")

    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    if not user:
        user = User(id=uid, name="User")
        db.add(user)
        await db.flush()
    return user


@router.get("", response_model=List[EmergencyContactSchema])
async def get_contacts(
    x_user_id: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    """Get all emergency contacts for the current user."""
    user = await get_or_create_user(x_user_id, db)
    result = await db.execute(
        select(EmergencyContact).where(EmergencyContact.user_id == user.id)
    )
    contacts = result.scalars().all()
    return contacts


@router.post("", response_model=EmergencyContactSchema, status_code=201)
async def create_contact(
    body: EmergencyContactCreate,
    x_user_id: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    """Add a new emergency contact."""
    user = await get_or_create_user(x_user_id, db)
    contact = EmergencyContact(
        user_id=user.id,
        name=body.name,
        phone=body.phone,
        relationship=body.relationship,
    )
    db.add(contact)
    await db.flush()
    return contact


@router.put("/{contact_id}", response_model=EmergencyContactSchema)
async def update_contact(
    contact_id: UUID,
    body: EmergencyContactUpdate,
    x_user_id: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    """Update an emergency contact."""
    user = await get_or_create_user(x_user_id, db)
    result = await db.execute(
        select(EmergencyContact).where(
            EmergencyContact.id == contact_id,
            EmergencyContact.user_id == user.id,
        )
    )
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    if body.name is not None:
        contact.name = body.name
    if body.phone is not None:
        contact.phone = body.phone
    if body.relationship is not None:
        contact.relationship = body.relationship

    await db.flush()
    return contact


@router.delete("/{contact_id}", status_code=204)
async def delete_contact(
    contact_id: UUID,
    x_user_id: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    """Delete an emergency contact."""
    user = await get_or_create_user(x_user_id, db)
    result = await db.execute(
        select(EmergencyContact).where(
            EmergencyContact.id == contact_id,
            EmergencyContact.user_id == user.id,
        )
    )
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    await db.delete(contact)
    await db.flush()
