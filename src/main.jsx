import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, CheckCircle2, Layers3, Search, Sparkles } from "lucide-react";
import { VideoOpenInvitation } from "./sites/video-open-invitation/VideoOpenInvitation";
import { siteMeta as videoOpenMeta } from "./sites/video-open-invitation/data";
import { LacePhotoScratch } from "./sites/lace-photo-scratch/LacePhotoScratch";
import { siteMeta as laceScratchMeta } from "./sites/lace-photo-scratch/data";
import "./app.css";

const templates = [videoOpenMeta, laceScratchMeta];

const routes = {
  "/video-open-invitation/": <VideoOpenInvitation />,
  "/lace-photo-scratch/": <LacePhotoScratch />,
};

function AppRouter() {
  const path = normalizePath(window.location.pathname);
  return routes[path] ?? <TemplateIndex />;
}

function normalizePath(pathname) {
  if (pathname === "/video-open-invitation") return "/video-open-invitation/";
  if (pathname === "/lace-photo-scratch") return "/lace-photo-scratch/";
  return pathname;
}

function TemplateIndex() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = useMemo(() => ["All", ...new Set(templates.map((template) => template.category))], []);
  const filteredTemplates = useMemo(
    () =>
      templates.filter((template) => {
        const haystack = [
          template.title,
          template.category,
          template.eventType,
          template.status,
          template.summary,
          template.template.siteType,
          template.template.experienceType,
          template.template.introType,
          template.template.layoutFamily,
          ...template.tags,
        ]
          .join(" ")
          .toLowerCase();
        const categoryMatches = selectedCategory === "All" || template.category === selectedCategory;
        return categoryMatches && haystack.includes(query.trim().toLowerCase());
      }),
    [query, selectedCategory],
  );
  const groupedTemplates = useMemo(
    () =>
      filteredTemplates.reduce((groups, template) => {
        groups[template.category] = groups[template.category] ?? [];
        groups[template.category].push(template);
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
              <strong>{templates.length}</strong>
              <span>Sites</span>
            </div>
            <div>
              <CheckCircle2 size={20} aria-hidden="true" />
              <strong>{templates.filter((template) => template.status.includes("Finished")).length}</strong>
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
              Showing {filteredTemplates.length} of {templates.length} testable sites
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
                  {categoryTemplates.map((template) => (
                    <TemplateCard template={template} key={template.id} />
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
