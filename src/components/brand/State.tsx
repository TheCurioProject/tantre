import { Brand } from "./Brand";
export function State({
  kind = "error",
  title,
  children,
  onRetry,
}: {
  kind?:
    | "error"
    | "offline"
    | "sin-resultados"
    | "empty-favoritos"
    | "loading-static"
    | "success";
  title: string;
  children?: React.ReactNode;
  onRetry?: () => void;
}) {
  return (
    <div
      className="state"
      role={kind === "error" || kind === "offline" ? "alert" : "status"}
    >
      <Brand name={`state-${kind}`} />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {onRetry && (
        <button className="text-link" onClick={onRetry}>
          Volver a intentar <Brand name="ui-forward" />
        </button>
      )}
    </div>
  );
}
