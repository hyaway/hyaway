interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="text-muted-foreground py-12 text-center xl:text-start">
      {message}
    </div>
  );
}
