import { motion } from 'framer-motion';

export default function PageHeader({ title, description, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-white tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-slate-400 max-w-2xl">{description}</p>
          )}
        </div>
        {children && <div className="flex gap-3 flex-wrap">{children}</div>}
      </div>
    </motion.div>
  );
}
