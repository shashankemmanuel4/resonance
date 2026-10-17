import React, { createContext, useContext, useState, useCallback } from "react";

interface DataVersionContextType {
  dataVersion: number;
  incrementVersion: () => void;
}

const DataVersionContext = createContext<DataVersionContextType>({
  dataVersion: 0,
  incrementVersion: () => {},
});

export const DataVersionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataVersion, setDataVersion] = useState(0);

  const incrementVersion = useCallback(() => {
    setDataVersion((v) => v + 1);
  }, []);

  return (
    <DataVersionContext.Provider value={{ dataVersion, incrementVersion }}>
      {children}
    </DataVersionContext.Provider>
  );
};

export function useDataVersion(): DataVersionContextType {
  return useContext(DataVersionContext);
}
