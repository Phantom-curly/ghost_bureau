type ToolbarProps = {
  onClear: () => void
  onReset: () => void
}

export function Toolbar({ onClear, onReset }: ToolbarProps) {
  return (
    <div className="toolbar">
      <button type="button" onClick={onClear}>
        Очистить заявки
      </button>
      <button type="button" onClick={onReset}>
        Сбросить
      </button>
    </div>
  )
}
