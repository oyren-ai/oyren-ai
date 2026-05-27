import React from 'react';

interface PageNavigationProps {
  GoToPreviousPage: React.ComponentType;
  CurrentPageInput: React.ComponentType;
  NumberOfPages: React.ComponentType;
  GoToNextPage: React.ComponentType;
}

const PageNavigation: React.FC<PageNavigationProps> = ({
  GoToPreviousPage,
  CurrentPageInput,
  NumberOfPages,
  GoToNextPage
}) => {
  return (
    <>
      <div style={{ padding: '0px 2px' }}>
        <GoToPreviousPage />
      </div>
      <div style={{ padding: '0px 2px', display: 'flex', alignItems: 'center' }}>
        <CurrentPageInput />
        <span style={{ margin: '0 4px' }}>/</span>
        <NumberOfPages />
      </div>
      <div style={{ padding: '0px 2px' }}>
        <GoToNextPage />
      </div>
    </>
  );
};

export default PageNavigation;