/**
 * chart.js — Chart.js 공통 유틸리티
 * server/web/assets/js/chart.js
 *
 * 모든 차트는 다크모드 기반 색상 팔레트를 공유합니다.
 * Chart.js CDN 로드 후에 이 파일을 불러오세요.
 */

const ChartUtils = (() => {
  const COLOR = {
    text: '#e8e8e8',
    textMuted: '#9ca3af',
    grid: 'rgba(255,255,255,0.06)',
    palette: ['#4f8ef7','#3dba6f','#e0a23c','#e05252','#a56ff4','#3dc0d8','#f76f9d','#8bc34a','#ff9800','#00bcd4'],
  };

  /** 공통 scale 옵션 (x, y 공용) */
  function scaleOpts(overrides = {}) {
    return {
      ticks: { color: COLOR.text, ...overrides.ticks },
      grid: { color: COLOR.grid, ...overrides.grid },
      ...overrides,
    };
  }

  /** 공통 legend 옵션 */
  function legendOpts(position = 'top') {
    return { labels: { color: COLOR.text, padding: 16 }, position };
  }

  /** 공통 tooltip 옵션 */
  function tooltipOpts() {
    return {
      backgroundColor: '#1e2030',
      titleColor: COLOR.text,
      bodyColor: COLOR.textMuted,
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
    };
  }

  /**
   * 라인 차트 생성
   * @param {HTMLCanvasElement} canvas
   * @param {string[]} labels
   * @param {{ label: string, data: number[], color?: string }[]} datasets
   * @param {object} opts 추가 Chart.js 옵션
   */
  function createLineChart(canvas, labels, datasets, opts = {}) {
    return new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: datasets.map((ds, i) => ({
          label: ds.label,
          data: ds.data,
          borderColor: ds.color || COLOR.palette[i % COLOR.palette.length],
          backgroundColor: hexAlpha(ds.color || COLOR.palette[i % COLOR.palette.length], 0.12),
          fill: ds.fill ?? false,
          tension: 0.35,
          pointRadius: 3,
          ...ds.extra,
        })),
      },
      options: {
        responsive: true,
        plugins: {
          legend: legendOpts(),
          tooltip: tooltipOpts(),
          ...opts.plugins,
        },
        scales: {
          x: scaleOpts(),
          y: scaleOpts(),
          ...opts.scales,
        },
        ...opts,
      },
    });
  }

  /**
   * 바 차트 생성
   * @param {HTMLCanvasElement} canvas
   * @param {string[]} labels
   * @param {{ label: string, data: number[], color?: string }[]} datasets
   * @param {object} opts indexAxis: 'y' for horizontal
   */
  function createBarChart(canvas, labels, datasets, opts = {}) {
    return new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: datasets.map((ds, i) => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: ds.color || COLOR.palette[i % COLOR.palette.length],
          ...ds.extra,
        })),
      },
      options: {
        responsive: true,
        indexAxis: opts.indexAxis || 'x',
        plugins: {
          legend: legendOpts(),
          tooltip: tooltipOpts(),
          ...opts.plugins,
        },
        scales: {
          x: scaleOpts(),
          y: scaleOpts(),
          ...opts.scales,
        },
        ...opts,
      },
    });
  }

  /**
   * 파이/도넛 차트 생성
   * @param {HTMLCanvasElement} canvas
   * @param {string[]} labels
   * @param {number[]} data
   * @param {'pie'|'doughnut'} type
   */
  function createPieChart(canvas, labels, data, type = 'doughnut', opts = {}) {
    return new Chart(canvas, {
      type,
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: COLOR.palette.slice(0, data.length),
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: legendOpts(opts.legendPosition || 'right'),
          tooltip: tooltipOpts(),
          ...opts.plugins,
        },
        ...opts,
      },
    });
  }

  /** hex 색상에 알파값 추가 */
  function hexAlpha(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  return { createLineChart, createBarChart, createPieChart, COLOR };
})();
