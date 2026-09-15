type PlaceholderTabProps = {
  label: string
}

export function PlaceholderTab({ label }: PlaceholderTabProps) {
  return (
    <p className="placeholder-tab">
      {label} готовится в следующем этапе.
    </p>
  )
}
