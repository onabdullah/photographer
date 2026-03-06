import { Link } from '@inertiajs/react';
import { Eye, Pencil, Trash2 } from 'lucide-react';

/**
 * View / Edit / Delete action buttons — dark theme style.
 * Matches the design: dark grey View/Edit, dark red Delete, with icons.
 *
 * @param {Object} props
 * @param {string} [props.viewHref] — Link for View
 * @param {string} [props.editHref] — Link for Edit
 * @param {Function} [props.onDelete] — Handler for Delete (parent handles confirmation)
 */
export default function ActionButtons({ viewHref, editHref, onDelete }) {
    return (
        <div className="flex items-center justify-end gap-1.5">
            {viewHref && (
                <Link href={viewHref} className="btn-action-view">
                    <Eye size={12} className="flex-shrink-0" />
                    View
                </Link>
            )}
            {editHref && (
                <Link href={editHref} className="btn-action-edit">
                    <Pencil size={12} className="flex-shrink-0" />
                    Edit
                </Link>
            )}
            {onDelete && (
                <button type="button" onClick={onDelete} className="btn-action-delete">
                    <Trash2 size={12} className="flex-shrink-0" />
                    Delete
                </button>
            )}
        </div>
    );
}
