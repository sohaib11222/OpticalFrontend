import { useRouteError } from "react-router-dom";

/** Route-level counterpart to AppErrorBoundary; never expose framework stacks. */
export default function RouteErrorFallback() {
  // Reading the error marks it handled for React Router. Do not render its
  // message because it can contain implementation or provider details.
  useRouteError();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Vista Express 360</p>
        <h1 className="mt-3 text-2xl font-bold">Aggiorniamo la pagina</h1>
        <p className="mt-3 leading-6 text-slate-600">Si è verificata un’interruzione temporanea. I tuoi dati non sono stati modificati.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => window.location.assign("/dashboard")} className="rounded-md bg-blue-700 px-4 py-2 font-semibold text-white transition hover:bg-blue-800">Torna alla dashboard</button>
          <button type="button" onClick={() => window.location.reload()} className="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50">Ricarica pagina</button>
        </div>
      </section>
    </main>
  );
}
