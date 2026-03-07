export default function PageHero({
    eyebrow,
    title,
    description,
    badges = null,
    aside = null,
    children = null,
    className = "",
    orbClassName = "bg-brand-500/10"
}) {
    return (
        <section className={`card-surface relative overflow-hidden p-6 ${className}`.trim()}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-brand-500/16 via-accent-400/10 to-transparent" />
            <div className={`floating-orb right-8 top-8 h-24 w-24 ${orbClassName}`.trim()} />

            <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] xl:items-end">
                <div>
                    {badges ? <div className="mb-5 flex flex-wrap items-center gap-3">{badges}</div> : null}
                    {eyebrow ? <p className="section-title">{eyebrow}</p> : null}
                    <h1 className="display-title mt-2 max-w-3xl text-balance text-3xl font-bold text-white sm:text-[2.55rem]">{title}</h1>
                    {description ? <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">{description}</p> : null}
                    {children ? <div className="mt-5 space-y-4">{children}</div> : null}
                </div>

                {aside ? <div className="xl:pl-4">{aside}</div> : null}
            </div>
        </section>
    );
}