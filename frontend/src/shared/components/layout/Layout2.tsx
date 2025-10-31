import { ReactNode } from 'react';
import ContentContainer from './ContentContainer';

export interface Layout2Props {
  children: ReactNode;
  header: ReactNode;
  bottomBar?: ReactNode;
}

export default function Layout2({ children, header, bottomBar }: Layout2Props) {
  return (
    <div className="grid grid-rows-[110px_1fr] gap-px w-full h-full max-h-screen relative">
      {/* Header Container */}
      <div className="w-full h-[110px]">
        {header}
      </div>

      {/* Content Container */}
      <ContentContainer>
        {children}
      </ContentContainer>

      {/* Bottom Input Bar - Fixed at bottom of Layout2 */}
      {bottomBar && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-4 z-50">
          {bottomBar}
        </div>
      )}
    </div>
  );
}
