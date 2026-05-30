/**
 * SENTINEL SOS — Emergency Contacts Page
 * Manage, edit, and call primary emergency contacts.
 */
import React, { useState, useEffect } from 'react'
import { 
  getEmergencyContacts, 
  addEmergencyContact, 
  updateEmergencyContact, 
  deleteEmergencyContact 
} from '../services/api'

export default function EmergencyContacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Form State
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formRelation, setFormRelation] = useState('family')
  const [submitting, setSubmitting] = useState(false)

  // Fetch contacts
  const loadContacts = async () => {
    try {
      setLoading(true)
      const data = await getEmergencyContacts()
      setContacts(data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch emergency contacts:', err)
      setError('Failed to load contacts. Please verify your connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContacts()
  }, [])

  // Open Form for Adding
  const handleOpenAdd = () => {
    setEditId(null)
    setFormName('')
    setFormPhone('')
    setFormRelation('family')
    setShowForm(true)
  }

  // Open Form for Editing
  const handleOpenEdit = (contact) => {
    setEditId(contact.id)
    setFormName(contact.name)
    setFormPhone(contact.phone)
    setFormRelation(contact.relationship)
    setShowForm(true)
  }

  // Handle Delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this emergency contact?')) return
    try {
      await deleteEmergencyContact(id)
      setContacts(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error('Failed to delete contact:', err)
      alert('Could not remove contact. Please try again.')
    }
  }

  // Handle Submit (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formName.trim() || !formPhone.trim()) return
    
    setSubmitting(true)
    try {
      const payload = {
        name: formName.trim(),
        phone: formPhone.trim(),
        relationship: formRelation,
      }

      if (editId) {
        // Update existing
        const updated = await updateEmergencyContact(editId, payload)
        setContacts(prev => prev.map(c => c.id === editId ? updated : c))
      } else {
        // Create new
        const created = await addEmergencyContact(payload)
        setContacts(prev => [...prev, created])
      }
      
      setShowForm(false)
    } catch (err) {
      console.error('Failed to save emergency contact:', err)
      alert('Error saving contact details. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const relationColors = {
    family: 'bg-red-500/20 text-red-400 border-red-500/30',
    friend: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    doctor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    colleague: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl text-red-500 tracking-wider">👤 EMERGENCY CONTACTS</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Primary contacts alerted during critical incidents</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-red-600 hover:bg-red-700 text-white font-heading font-semibold text-xs tracking-wider
                     px-3.5 py-1.5 rounded-lg min-h-[40px] transition-colors active:scale-95 flex items-center gap-1"
          aria-label="Add new contact"
        >
          ➕ Add Contact
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
            <span className="text-neutral-500 font-heading text-sm tracking-wider">FETCHING EMERGENCY CONTACTS...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-950/20 border border-red-800/40 rounded-xl text-center">
            <p className="text-red-400 text-sm">{error}</p>
            <button 
              onClick={loadContacts}
              className="mt-3 text-xs bg-neutral-800 px-3 py-1.5 rounded border border-neutral-700 font-semibold"
            >
              🔄 Retry Load
            </button>
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-8 bg-neutral-900/40 border border-neutral-800 rounded-2xl text-center space-y-3">
            <span className="text-4xl block" aria-hidden="true">📣</span>
            <h2 className="font-heading text-lg text-neutral-300">No Contacts Added</h2>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Please add at least one emergency contact. In a CRITICAL emergency, the app will let you dial or alert them immediately.
            </p>
            <button
              onClick={handleOpenAdd}
              className="btn-emergency bg-red-600 hover:bg-red-700 text-white px-5 min-h-[44px] inline-flex items-center"
            >
              ➕ Add Your First Contact
            </button>
          </div>
        ) : (
          <div className="space-y-3" role="list">
            {contacts.map((contact) => (
              <div 
                key={contact.id} 
                role="listitem"
                className="card flex items-center justify-between gap-4 border border-neutral-800 bg-neutral-900/60 p-4"
              >
                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h2 className="font-heading text-lg text-neutral-200 tracking-wide truncate">
                      {contact.name}
                    </h2>
                    <span className={`text-[10px] font-bold font-heading px-2 py-0.5 rounded border uppercase shrink-0
                      ${relationColors[contact.relationship] || 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>
                      {contact.relationship}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-neutral-400">{contact.phone}</p>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg
                               w-11 h-11 transition-colors min-w-[44px] min-h-[44px]"
                    aria-label={`Call ${contact.name}`}
                  >
                    📞
                  </a>
                  <button
                    onClick={() => handleOpenEdit(contact)}
                    className="flex items-center justify-center bg-neutral-800 hover:bg-neutral-750 text-neutral-200 rounded-lg
                               w-11 h-11 transition-colors border border-neutral-700 min-w-[44px] min-h-[44px]"
                    aria-label={`Edit ${contact.name}`}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="flex items-center justify-center bg-neutral-900 hover:bg-red-950/40 text-red-500 rounded-lg
                               w-11 h-11 transition-colors border border-neutral-800 min-w-[44px] min-h-[44px]"
                    aria-label={`Delete ${contact.name}`}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB Button at bottom right */}
      <button
        onClick={handleOpenAdd}
        className="fixed bottom-24 right-4 bg-red-600 hover:bg-red-700 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-2xl z-40 active:scale-95 transition-transform"
        aria-label="Add new contact floating"
      >
        ➕
      </button>

      {/* Add/Edit Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="flex justify-between items-center">
              <h2 id="modal-title" className="font-heading text-lg text-neutral-200 uppercase tracking-wider">
                {editId ? '✏️ Edit Contact' : '➕ Add Emergency Contact'}
              </h2>
              <button 
                onClick={() => setShowForm(false)}
                className="text-neutral-500 hover:text-white p-2 min-h-[40px]"
                aria-label="Close form"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-heading font-semibold uppercase tracking-wider">
                  Contact Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-heading font-semibold uppercase tracking-wider">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="e.g. +1 555-0199 or 112"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              {/* Relationship */}
              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-heading font-semibold uppercase tracking-wider">
                  Relationship
                </label>
                <select
                  value={formRelation}
                  onChange={(e) => setFormRelation(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-red-600 focus:outline-none min-h-[40px]"
                >
                  <option value="family">Family member</option>
                  <option value="friend">Friend</option>
                  <option value="doctor">Medical Doctor</option>
                  <option value="colleague">Colleague</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 text-neutral-300 font-heading font-semibold tracking-wider text-sm rounded-lg min-h-[44px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formName.trim() || !formPhone.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-heading font-semibold tracking-wider text-sm rounded-lg min-h-[44px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : editId ? 'Save Changes' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
