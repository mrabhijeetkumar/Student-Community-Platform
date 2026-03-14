export default function PageHero({
    eyebrow,
    title,
    description,
    badges = null,
    aside = null,
    children = null,
    className = "",
    orbClassName = ""
}) {
    return (
        <section className={`card-surface relative overflow-hidden p-6 ${className}`.trim()}>
            <div
                className="pointer-events-none absolute inset-x-0 top-0 h-24"
                style={{ background: "linear-gradient(90deg, rgba(52,164,255,0.2) 0%, rgba(255,138,0,0.16) 58%, rgba(255,255,255,0) 100%)" }}
            />
            <div
                className={`floating-orb right-8 top-8 h-24 w-24 ${orbClassName}`.trim()}
                style={{ background: "radial-gradient(circle at 36% 32%, rgba(255,255,255,0.82), rgba(255,255,255,0.06) 66%)" }}
            />

            <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] xl:items-end">
                <div>
                    {badges ? <div className="mb-5 flex flex-wrap items-center gap-3">{badges}</div> : null}
                    {eyebrow ? <p className="section-title">{eyebrow}</p> : null}
                    <h1 className="display-title mt-2 max-w-3xl text-balance text-3xl font-bold text-white sm:text-[2.55rem]">{title}</h1>
                    {description ? <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200/80">{description}</p> : null}
                    {children ? <div className="mt-5 space-y-4">{children}</div> : null}
                </div>

                {aside ? <div className="xl:pl-4">{aside}</div> : null}
            </div>
        </section>
    );
}