import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          nav_home: "Home",
          nav_map: "Emergency Map",
          nav_chat: "SOS Chat",
          nav_firstaid: "First Aid",
          nav_profile: "Profile",
          nav_contacts: "Contacts",
          nav_incidents: "Incidents"
        }
      },
      hi: {
        translation: {
          nav_home: "मुख्य पृष्ठ",
          nav_map: "मानचित्र",
          nav_chat: "एसओएस चैट",
          nav_firstaid: "प्राथमिक उपचार",
          nav_profile: "प्रोफ़ाइल",
          nav_contacts: "संपर्क",
          nav_incidents: "इतिहास"
        }
      }
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
