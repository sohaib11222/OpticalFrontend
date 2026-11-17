import { Component, type ErrorInfo, type ReactNode } from "react";

type State = { error: Error | null };

/**
 * Third-party browser translation tools can mutate a React-owned text node
 * between route transitions.  React then correctly refuses to remove a node
 * it no longer owns.  Prevent their mutation where possible and provide a
 * calm recovery screen if a browser extension still interferes.
 */
export default class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep diagnostic context in the browser console without exposing a stack
    // trace to shop users in production.
    console.error("Vista Express 360 UI recovery", error, info.componentStack);
  }

  private recover = () => {
    this.setState({ error: null });
    window.location.assign("/dashboard");
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900">
        <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Vista Express 360</p>
          <h1 className="mt-3 text-2xl font-bold">Aggiorniamo la pagina</h1>
          <p className="mt-3 leading-6 text-slate-600">
            La pagina ha subito un’interruzione temporanea. I tuoi dati non sono stati modificati.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={this.recover} className="rounded-md bg-blue-700 px-4 py-2 font-semibold text-white transition hover:bg-blue-800">
              Torna alla dashboard
            </button>
            <button type="button" onClick={() => window.location.reload()} className="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50">
              Ricarica pagina
            </button>
          </div>
        </section>
      </main>
    );
  }
}
