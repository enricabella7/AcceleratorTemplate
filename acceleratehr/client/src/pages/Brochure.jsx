import useSWR from 'swr';
import { fetcher, uploadUrl } from '../lib/api';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { CardSkeleton } from '../components/Skeleton';
import { Download, Eye, FileText, Presentation, Image } from 'lucide-react';

const typeIcons = {
  PDF: FileText,
  PPT: Presentation,
  PPTX: Presentation,
  PNG: Image,
  JPG: Image,
  JPEG: Image,
};

export default function Brochure() {
  const { data: assets, isLoading } = useSWR('/brochure', fetcher);

  return (
    <div>
      <PageHeader
        title="Brochure & Resources"
        description="Explore strategic documents, presentations, and reference guides. Download or preview assets uploaded by your admin team."
      />

      {isLoading ? (
        <CardSkeleton count={4} />
      ) : !assets?.length ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No resources yet</h3>
          <p className="text-slate-400 text-sm">Assets will appear here once uploaded via the Admin Panel.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset, i) => {
            const Icon = typeIcons[asset.file_type] || FileText;
            return (
              <Card key={asset.id} delay={i * 0.05}>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{asset.title}</h3>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{asset.description}</p>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {asset.file_type && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                          {asset.file_type}
                        </span>
                      )}
                      {asset.file_size && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                          {asset.file_size}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  {asset.file_path && (
                    <>
                      <a
                        href={uploadUrl(asset.file_path)}
                        download
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-blue text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
                      >
                        <Download size={14} />
                        Download
                      </a>
                      <a
                        href={uploadUrl(asset.file_path)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold hover:bg-white/10 transition-colors"
                      >
                        <Eye size={14} />
                        View
                      </a>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
