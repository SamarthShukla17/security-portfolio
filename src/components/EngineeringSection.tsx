import { projects } from "@/lib/projects";

export default function EngineeringSection() {
  return (
    <section
      id="engineering"
      className="max-w-3xl mx-auto px-4 py-16 border-t border-muted/20"
    >
      <p className="text-muted mb-6">$ ls engineering/</p>

      <div className="space-y-8">
        {projects.map((project) => (
          <article key={project.slug} className="border border-muted/20 p-4">
            <h3 className="text-foreground font-medium">{project.name}</h3>

            <p className="mt-2 text-muted leading-relaxed">
              {project.description}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted/60">
              {project.stack.map((tech) => (
                <span key={tech}>[{tech}]</span>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 text-sm">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline underline-offset-4"
                >
                  → live
                </a>
              )}
              {project.sourceUrl && (
                <a
                  href={project.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline underline-offset-4"
                >
                  → source
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
