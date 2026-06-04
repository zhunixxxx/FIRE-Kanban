import type { FinancialEvent } from "../types";
import { EventConfig } from "./EventConfig";
import { Modal } from "./ui";

interface Props {
  open: boolean;
  onClose: () => void;
  events: FinancialEvent[];
  onChange: (events: FinancialEvent[]) => void;
  /** null 表示新建 */
  editEventId: string | null;
}

export function EventConfigModal({
  open,
  onClose,
  events,
  onChange,
  editEventId,
}: Props) {
  const isNew = editEventId === null;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isNew ? "添加事件" : "编辑事件"}
      size="event"
    >
      <EventConfig
        events={events}
        onChange={onChange}
        editEventId={editEventId}
        onSaved={onClose}
      />
    </Modal>
  );
}
