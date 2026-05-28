/**
 * i18next configuration — English + Hindi.
 * Language auto-detected from browser; falls back to English.
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const resources = {
  en: {
    translation: {
      // Navigation
      nav_heatmap: 'Heatmap',
      nav_report: 'Report',
      nav_authority: 'Authority',
      nav_community: 'Community',

      // Report page
      report_title: 'Report Road Damage',
      report_subtitle: 'Capture an image, confirm your location, and submit. Our AI will classify the damage instantly.',
      report_capture: 'Capture / Upload Image',
      report_tap_camera: '📷 Tap to capture or upload',
      report_retake: 'Retake',
      report_damage_type: 'Damage Type',
      report_road_type: 'Road Type',
      report_severity: 'Severity',
      report_submit: 'Submit Report',
      report_submitting: 'Submitting…',
      report_offline_queued: '📶 Offline — your report will sync when connected',
      report_success: 'Report submitted successfully',
      report_routed_to: 'Complaint routed to',

      // Damage types
      damage_pothole: 'Pothole',
      damage_crack: 'Crack',
      damage_flooding: 'Flooding',
      damage_broken_signal: 'Broken Signal',
      damage_missing_divider: 'Missing Divider',

      // Severity
      severity_low: 'Low',
      severity_medium: 'Medium',
      severity_high: 'High',

      // Heatmap
      map_title: 'Live Risk Heatmap',
      map_filter_city: 'City',
      map_filter_risk: 'Risk Level',
      map_filter_road: 'Road Type',
      map_all: 'All',
      map_last_updated: 'Last updated',
      map_forecast_toggle: '7-day forecast',
      map_accidents_toggle: 'Accidents',

      // Zone popup
      zone_api_score: 'API Score',
      zone_risk: 'Risk',
      zone_reports: 'Reports',
      zone_last_relay: 'Last relay',
      zone_view_details: 'View details →',
      zone_forecast: '7-day forecast',

      // Authority
      authority_title: 'Authority Dashboard',
      authority_priority: 'Priority Repair Queue',
      authority_transparency: 'Budget Transparency',
      authority_complaints: 'Complaint Inbox',
      authority_export: 'Export CSV',
      authority_assign: 'Assign Repair',

      // Risk categories
      risk_low: 'Low',
      risk_medium: 'Medium',
      risk_high: 'High',
      risk_critical: 'Critical',

      // Offline
      offline_banner: '📶 Offline — {{count}} report(s) queued',
      offline_synced: '✅ {{count}} report(s) synced',

      // Community
      community_title: 'Community',
      community_top_contributors: 'Top Contributors',
      community_leaderboard: 'City Leaderboard',
      community_impact: 'Impact Counter',
    },
  },
  hi: {
    translation: {
      nav_heatmap: 'हीटमैप',
      nav_report: 'रिपोर्ट',
      nav_authority: 'प्राधिकरण',
      nav_community: 'समुदाय',

      report_title: 'सड़क क्षति की रिपोर्ट करें',
      report_subtitle: 'एक छवि कैप्चर करें, अपना स्थान पुष्टि करें और सबमिट करें।',
      report_capture: 'छवि कैप्चर / अपलोड करें',
      report_tap_camera: '📷 कैप्चर या अपलोड करने के लिए टैप करें',
      report_retake: 'फिर से लें',
      report_damage_type: 'क्षति का प्रकार',
      report_road_type: 'सड़क का प्रकार',
      report_severity: 'गंभीरता',
      report_submit: 'रिपोर्ट सबमिट करें',
      report_submitting: 'सबमिट हो रहा है…',
      report_offline_queued: '📶 ऑफलाइन — कनेक्ट होने पर आपकी रिपोर्ट सिंक होगी',
      report_success: 'रिपोर्ट सफलतापूर्वक सबमिट की गई',
      report_routed_to: 'शिकायत भेजी गई',

      damage_pothole: 'गड्ढा',
      damage_crack: 'दरार',
      damage_flooding: 'बाढ़',
      damage_broken_signal: 'टूटी सिग्नल',
      damage_missing_divider: 'गायब डिवाइडर',

      severity_low: 'कम',
      severity_medium: 'मध्यम',
      severity_high: 'अधिक',

      map_title: 'लाइव जोखिम हीटमैप',
      map_filter_city: 'शहर',
      map_filter_risk: 'जोखिम स्तर',
      map_filter_road: 'सड़क प्रकार',
      map_all: 'सभी',
      map_last_updated: 'अंतिम अपडेट',
      map_forecast_toggle: '7-दिन का पूर्वानुमान',
      map_accidents_toggle: 'दुर्घटनाएं',

      zone_api_score: 'API स्कोर',
      zone_risk: 'जोखिम',
      zone_reports: 'रिपोर्ट',
      zone_last_relay: 'अंतिम रिलेइंग',
      zone_view_details: 'विवरण देखें →',
      zone_forecast: '7-दिन का पूर्वानुमान',

      authority_title: 'प्राधिकरण डैशबोर्ड',
      authority_priority: 'प्राथमिकता मरम्मत कतार',
      authority_transparency: 'बजट पारदर्शिता',
      authority_complaints: 'शिकायत इनबॉक्स',
      authority_export: 'CSV निर्यात करें',
      authority_assign: 'मरम्मत सौंपें',

      risk_low: 'कम',
      risk_medium: 'मध्यम',
      risk_high: 'उच्च',
      risk_critical: 'गंभीर',

      offline_banner: '📶 ऑफलाइन — {{count}} रिपोर्ट कतार में',
      offline_synced: '✅ {{count}} रिपोर्ट सिंक हुई',

      community_title: 'समुदाय',
      community_top_contributors: 'शीर्ष योगदानकर्ता',
      community_leaderboard: 'शहर लीडरबोर्ड',
      community_impact: 'प्रभाव काउंटर',
    },
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

export default i18n
