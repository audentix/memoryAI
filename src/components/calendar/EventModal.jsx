import Modal from '../shared/Modal';
import { Clock, MapPin, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export default function EventModal({ isOpen, onClose, event }) {
  if (!event) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={event.title} size="sm">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Clock size={14} />
          <span>
            {event.allDay
              ? 'All day'
              : `${format(event.start, 'h:mm a')} - ${format(event.end, 'h:mm a')}`}
          </span>
        </div>

        {event.location && (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <MapPin size={14} />
            <span>{event.location}</span>
          </div>
        )}

        {event.description && (
          <div>
            <h4 className="text-sm font-medium text-text mb-1">Description</h4>
            <p className="text-sm text-text-muted whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {event.htmlLink && (
          <a
            href={event.htmlLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary-light"
          >
            <ExternalLink size={14} />
            Open in Google Calendar
          </a>
        )}
      </div>
    </Modal>
  );
}
