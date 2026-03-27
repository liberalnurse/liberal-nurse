// Messagerie interne entre membres du cabinet
import { useState } from 'react'
import { clsx } from 'clsx'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'

interface ConversationItem {
  id: string
  with: string
  avatar: string
  lastMessage: string
  time: string
  unread: number
}

interface MessageItem {
  id: string
  sender: string
  content: string
  time: string
  mine: boolean
}

const mockConversations: ConversationItem[] = [
  { id: '1', with: 'Sophie Lefèvre',  avatar: 'S', lastMessage: 'La visite chez Dupont est reprogrammée à 9h30.',  time: '10:42', unread: 2 },
  { id: '2', with: 'Marie Durand',    avatar: 'M', lastMessage: 'Tu peux prendre la tournée de samedi ?',           time: 'Hier',  unread: 0 },
  { id: '3', with: 'Anne Bertrand',   avatar: 'A', lastMessage: 'Ordonnance Leblanc reçue, archivée.',              time: 'Lun',   unread: 0 },
  { id: '4', with: 'Cabinet (tous)',  avatar: '📢', lastMessage: 'Rappel : réunion d\'équipe vendredi 14h.',         time: 'Ven',   unread: 1 },
]

const mockMessages: Record<string, MessageItem[]> = {
  '1': [
    { id: '1', sender: 'Sophie Lefèvre', content: 'Bonjour ! La visite chez Mme Dupont est reprogrammée à 9h30 demain.', time: '10:40', mine: false },
    { id: '2', sender: 'Moi', content: 'Ok je note, merci !', time: '10:41', mine: true },
    { id: '3', sender: 'Sophie Lefèvre', content: 'La visite chez Dupont est reprogrammée à 9h30.', time: '10:42', mine: false },
  ],
  '2': [
    { id: '1', sender: 'Marie Durand', content: 'Salut, tu peux prendre la tournée de samedi ? J\'ai un empêchement.', time: 'Hier 14:30', mine: false },
    { id: '2', sender: 'Moi', content: 'Je vais vérifier et je te dis ça ce soir.', time: 'Hier 14:35', mine: true },
  ],
  '3': [
    { id: '1', sender: 'Anne Bertrand', content: 'Ordonnance Leblanc reçue, archivée dans son dossier.', time: 'Lun 11:00', mine: false },
  ],
  '4': [
    { id: '1', sender: 'Cabinet (tous)', content: 'Rappel : réunion d\'équipe vendredi 14h en salle de réunion.', time: 'Ven 09:00', mine: false },
  ],
}

export default function MessageriePage() {
  const [conversations] = useState(mockConversations)
  const [selected, setSelected] = useState<string | null>('1')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState(mockMessages)
  const [showNewModal, setShowNewModal] = useState(false)

  const activeConv = conversations.find((c) => c.id === selected)
  const activeMessages = selected ? (messages[selected] ?? []) : []

  const handleSend = () => {
    if (!message.trim() || !selected) return
    const newMsg: MessageItem = {
      id: String(Date.now()),
      sender: 'Moi',
      content: message,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      mine: true,
    }
    setMessages((prev) => ({ ...prev, [selected]: [...(prev[selected] ?? []), newMsg] }))
    setMessage('')
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Messagerie"
        subtitle="Messages internes du cabinet"
        actions={
          <Button onClick={() => setShowNewModal(true)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nouveau message
          </Button>
        }
      />

      <div className="flex h-[calc(100vh-220px)] min-h-[500px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {/* Sidebar conversations */}
        <div className="w-72 shrink-0 border-r border-gray-100 dark:border-gray-800">
          <div className="p-3">
            <Input placeholder="Rechercher..." />
          </div>
          <div className="overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelected(conv.id)}
                className={clsx(
                  'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                  selected === conv.id
                    ? 'bg-navy-50 dark:bg-navy-900/30'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-100 text-sm font-bold text-navy-700 dark:bg-navy-900 dark:text-navy-300">
                  {conv.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{conv.with}</p>
                    <span className="text-xs text-gray-400">{conv.time}</span>
                  </div>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-navy-600 text-[10px] font-bold text-white">
                    {conv.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Zone messages */}
        <div className="flex min-w-0 flex-1 flex-col">
          {activeConv ? (
            <>
              <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-100 text-sm font-bold text-navy-700 dark:bg-navy-900 dark:text-navy-300">
                  {activeConv.avatar}
                </div>
                <p className="font-medium text-gray-900 dark:text-white">{activeConv.with}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeMessages.map((msg) => (
                  <div key={msg.id} className={clsx('flex', msg.mine ? 'justify-end' : 'justify-start')}>
                    <div className={clsx(
                      'max-w-xs rounded-2xl px-4 py-2 text-sm',
                      msg.mine
                        ? 'bg-navy-600 text-white'
                        : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                    )}>
                      <p>{msg.content}</p>
                      <p className={clsx('mt-1 text-right text-[10px]', msg.mine ? 'text-navy-200' : 'text-gray-400')}>{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-end gap-2 border-t border-gray-100 p-3 dark:border-gray-800">
                <div className="flex-1">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Votre message..."
                    rows={1}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  />
                </div>
                <Button onClick={handleSend} disabled={!message.trim()}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-gray-400">
              Sélectionnez une conversation
            </div>
          )}
        </div>
      </div>

      <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title="Nouveau message">
        <div className="space-y-4">
          <Input label="Destinataire" placeholder="Nom du membre du cabinet..." />
          <Input label="Objet (optionnel)" placeholder="Objet du message..." />
          <Textarea label="Message" rows={4} placeholder="Votre message..." />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowNewModal(false)}>Annuler</Button>
            <Button onClick={() => setShowNewModal(false)}>Envoyer</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
