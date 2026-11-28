import { projects } from "@/lib/projects";

export default function EngineeringSection() {
  return (
    <section id="engineering" className="max-w-3xl mx-auto px-4 py-14">
      <h2 className="eyebrow mb-5">Engineering</h2>

      <div className="space-y-4">
        {projects.map((project) => (
          <article key={project.slug} className="card card-hover p-6">
            <h3 className="text-lg font-semibold tracking-tight">{project.name}</h3>

            <p className="mt-2 text-muted leading-relaxed">
              {project.description}
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {project.stack.map((tech) => (
                <span key={tech} className="chip">
                  {tech}
                </span>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {project.liveUrl && (
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                  Live ↗
                </a>
              )}
              {project.sourceUrl && (
                <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer">
                  Source ↗
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
