import React, { Suspense, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, CheckCircle2, Layers3, Search, Sparkles } from "lucide-react";
import registry from "./registry/index.js";
import "./app.css";

const metaList = registry.map((entry) => entry.meta);

const LazyRoutes = Object.fromEntries(
  registry.map((entry) => [
    entry.meta.href,
    React.lazy(() => entry.loadComponent().then((Component) => ({ default: Component }))),
  ]),
);

function AppRouter() {
  const path = normalizePath(window.location.pathname);
  const Component = LazyRoutes[path];

  if (Component) {
    return (
      <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading…</div>}>
        <Component />
      </Suspense>
    );
  }

  return <TemplateIndex />;
}

function normalizePath(pathname) {
  return pathname.endsWith("/") ? pathname : pathname + "/";
}

function TemplateIndex() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = useMemo(() => ["All", ...new Set(metaList.map((meta) => meta.category))], []);
  const filteredTemplates = useMemo(
    () =>
      metaList.filter((meta) => {
        const haystack = [
          meta.title,
          meta.category,
          meta.eventType,
          meta.status,
          meta.summary,
          meta.template.siteType,
          meta.template.experienceType,
          meta.template.introType,
          meta.template.layoutFamily,
          ...meta.tags,
        ]
          .join(" ")
          .toLowerCase();
        const categoryMatches = selectedCategory === "All" || meta.category === selectedCategory;
        return categoryMatches && haystack.includes(query.trim().toLowerCase());
      }),
    [query, selectedCategory],
  );
  const groupedTemplates = useMemo(
    () =>
      filteredTemplates.reduce((groups, meta) => {
        groups[meta.category] = groups[meta.category] ?? [];
        groups[meta.category].push(meta);
        return groups;
      }, {}),
    [filteredTemplates],
  );

  return (
    <main className="template-index">
      <section className="template-index__inner">
        <header className="template-hero">
          <div>
            <p className="template-index__eyebrow">Invitation template lab</p>
            <h1>Finished Websites Ready To Test</h1>
            <p className="template-hero__copy">
              Browse the current invitation templates by category, interaction type, event type, or feature.
            </p>
          </div>
          <div className="template-stats" aria-label="Template stats">
            <div>
              <Layers3 size={20} aria-hidden="true" />
              <strong>{metaList.length}</strong>
              <span>Sites</span>
            </div>
            <div>
              <CheckCircle2 size={20} aria-hidden="true" />
              <strong>{metaList.filter((meta) => meta.status.includes("Finished")).length}</strong>
              <span>Finished</span>
            </div>
            <div>
              <Sparkles size={20} aria-hidden="true" />
              <strong>{categories.length - 1}</strong>
              <span>Categories</span>
            </div>
          </div>
        </header>

        <section className="template-controls" aria-label="Search and filters">
          <label className="template-search">
            <Search size={19} aria-hidden="true" />
            <span className="sr-only">Search templates</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, category, intro, feature..."
            />
          </label>
          <div className="template-tabs" role="tablist" aria-label="Template categories">
            {categories.map((category) => (
              <button
                className={selectedCategory === category ? "is-active" : ""}
                type="button"
                key={category}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <section className="template-results" aria-live="polite">
          <div className="template-results__summary">
            <span>
              Showing {filteredTemplates.length} of {metaList.length} testable sites
            </span>
            {query ? <button type="button" onClick={() => setQuery("")}>Clear search</button> : null}
          </div>

          {filteredTemplates.length ? (
            Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
              <section className="template-category" key={category}>
                <div className="template-category__header">
                  <h2>{category}</h2>
                  <span>{categoryTemplates.length} site{categoryTemplates.length === 1 ? "" : "s"}</span>
                </div>
                <div className="template-index__grid">
                  {categoryTemplates.map((meta) => (
                    <TemplateCard template={meta} key={meta.id} />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="empty-state">
              <h2>No matching sites</h2>
              <p>Try another search term or switch back to all categories.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function TemplateCard({ template }) {
  return (
    <a className="template-card" href={template.href}>
      <div
        className="template-card__preview"
        style={{
          "--accent": template.preview.accent,
          backgroundImage: `linear-gradient(to bottom, rgba(18, 16, 12, 0.08), rgba(18, 16, 12, 0.42)), url("${template.preview.imageUrl}")`,
        }}
      >
        <span>{template.status}</span>
      </div>
      <div className="template-card__body">
        <div className="template-card__topline">
          <span>{template.eventType}</span>
          <span>{template.template.introType}</span>
        </div>
        <strong>{template.title}</strong>
        <p>{template.summary}</p>
        <dl className="template-card__meta">
          <div>
            <dt>Site</dt>
            <dd>{template.template.siteType}</dd>
          </div>
          <div>
            <dt>Experience</dt>
            <dd>{template.template.experienceType}</dd>
          </div>
          <div>
            <dt>Layout</dt>
            <dd>{template.template.layoutFamily}</dd>
          </div>
        </dl>
        <div className="template-tags">
          {template.tags.slice(0, 4).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <span className="template-card__cta">
          Open test site
          <ArrowRight size={18} aria-hidden="true" />
        </span>
      </div>
    </a>
  );
}

createRoot(document.getElementById("root")).render(<AppRouter />);
