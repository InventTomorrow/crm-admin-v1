import type { ApexOptions } from 'apexcharts';
import { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';

type PropsType = {
  type?: ApexChart['type'];
  height?: number | string;
  width?: number | string;
  getOptions: () => ApexOptions;
  series: ApexOptions['series'];
  className?: string;
};

const ApexChartClient = ({
  type,
  height,
  width = '100%',
  getOptions,
  series,
  className,
}: PropsType) => {
  // Memoize on the callback so charts recompute when theme/data deps change
  // (callers wrap getOptions in useCallback).
  const options = useMemo(() => getOptions(), [getOptions]);

  return (
    <ReactApexChart
      type={type}
      height={height}
      width={width}
      options={options}
      series={series}
      className={className}
    />
  );
};

export default ApexChartClient;
