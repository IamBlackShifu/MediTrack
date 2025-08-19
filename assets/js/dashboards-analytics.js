/**
 * Dashboard Analytics
 */

'use strict';

(function () {
  let cardColor, headingColor, legendColor, labelColor, shadeColor, borderColor;

  cardColor = config.colors.cardColor;
  headingColor = config.colors.headingColor;
  legendColor = config.colors.bodyColor;
  labelColor = config.colors.textMuted;
  borderColor = config.colors.borderColor;

  // // Order Area Chart
  // // --------------------------------------------------------------------
  // const orderAreaChartEl = document.querySelector('#orderChart'),
  //   orderAreaChartConfig = {
  //     chart: {
  //       height: 80,
  //       type: 'area',
  //       toolbar: {
  //         show: false
  //       },
  //       sparkline: {
  //         enabled: true
  //       }
  //     },
  //     markers: {
  //       size: 6,
  //       colors: 'transparent',
  //       strokeColors: 'transparent',
  //       strokeWidth: 4,
  //       discrete: [
  //         {
  //           fillColor: cardColor,
  //           seriesIndex: 0,
  //           dataPointIndex: 6,
  //           strokeColor: config.colors.success,
  //           strokeWidth: 2,
  //           size: 6,
  //           radius: 8
  //         }
  //       ],
  //       hover: {
  //         size: 7
  //       }
  //     },
  //     grid: {
  //       show: false,
  //       padding: {
  //         right: 8
  //       }
  //     },
  //     colors: [config.colors.success],
  //     fill: {
  //       type: 'gradient',
  //       gradient: {
  //         shade: shadeColor,
  //         shadeIntensity: 0.8,
  //         opacityFrom: 0.8,
  //         opacityTo: 0.25,
  //         stops: [0, 85, 100]
  //       }
  //     },
  //     dataLabels: {
  //       enabled: false
  //     },
  //     stroke: {
  //       width: 2,
  //       curve: 'smooth'
  //     },
  //     series: [
  //       {
  //         data: [180, 175, 275, 140, 205, 190, 295]
  //       }
  //     ],
  //     xaxis: {
  //       show: false,
  //       lines: {
  //         show: false
  //       },
  //       labels: {
  //         show: false
  //       },
  //       stroke: {
  //         width: 0
  //       },
  //       axisBorder: {
  //         show: false
  //       }
  //     },
  //     yaxis: {
  //       stroke: {
  //         width: 0
  //       },
  //       show: false
  //     }
  //   };
  // if (typeof orderAreaChartEl !== undefined && orderAreaChartEl !== null) {
  //   const orderAreaChart = new ApexCharts(orderAreaChartEl, orderAreaChartConfig);
  //   orderAreaChart.render();
  // }

  // Total Revenue Report Chart - Bar Chart
  // --------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", async function () {
    const totalRevenueChartEl = document.querySelector('#totalRevenueChart');

    // Function to group data by month
    function groupByMonth(data) {
      const groupedData = {};
      data.forEach(item => {
        const date = new Date(item.attributes.createdAt);
        const month = date.toLocaleString('default', { month: 'short' });
        if (!groupedData[month]) {
          groupedData[month] = 0;
        }
        groupedData[month]++;
      });
      return groupedData;
    }

    // Fetch data from clinic receives API
    async function fetchClinicReceives() {
      const response = await ApiHelper.get(MediTrackConfig.endpoints.clinicReceives);
      const data = await response.json();
      return groupByMonth(data.data);
    }

    // Fetch data from clinic processings API
    async function fetchClinicProcessings() {
      const response = await ApiHelper.get(MediTrackConfig.endpoints.clinicProcessings);
      const data = await response.json();
      return groupByMonth(data.data);
    }

    try {
      // Get data from both APIs
      const clinicReceivesData = await fetchClinicReceives();
      const clinicProcessingsData = await fetchClinicProcessings();

      // Prepare categories and series for the chart
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const receivesSeries = months.map(month => clinicReceivesData[month] || 0);
      const processingsSeries = months.map(month => clinicProcessingsData[month] || 0);

      // Chart options
      const totalRevenueChartOptions = {
        series: [
          {
            name: 'Clinic Receives',
            data: receivesSeries
          },
          {
            name: 'Clinic Processings',
            data: processingsSeries
          }
        ],
        chart: {
          height: 317,
          stacked: false, // Make sure bars are side by side
          type: 'bar',
          toolbar: { show: false }
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '45%', // Adjust column width for better separation
            borderRadius: 8,
            startingShape: 'rounded',
            endingShape:'rounded'
          }
        },
        colors: ['#28a745', '#007bff'], // Custom colors for receives and processings
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: 'smooth',
          width: 6,
          lineCap: 'round',
          colors: ['#fff']
        },
        legend: {
          show: true,
          horizontalAlign: 'left',
          position: 'top',
          markers: {
            height: 8,
            width: 8,
            radius: 12,
            offsetX: -5
          },
          fontSize: '13px',
          fontFamily: 'Public Sans',
          fontWeight: 400,
          labels: {
            colors: '#6c757d',
            useSeriesColors: false
          },
          itemMargin: {
            horizontal: 10
          }
        },
        grid: {
          strokeDashArray: 7,
          borderColor: '#e9ecef',
          padding: {
            top: 0,
            bottom: -8,
            left: 20,
            right: 20
          }
        },
        fill: {
          opacity: [1, 1]
        },
        xaxis: {
          categories: months,
          labels: {
            style: {
              fontSize: '13px',
              fontFamily: 'Public Sans',
              colors: '#6c757d'
            }
          },
          axisTicks: {
            show: false
          },
          axisBorder: {
            show: false
          }
        },
        yaxis: {
          labels: {
            style: {
              fontSize: '13px',
              fontFamily: 'Public Sans',
              colors: '#6c757d'
            }
          }
        },
        responsive: [
          {
            breakpoint: 1700,
            options: {
              plotOptions: {
                bar: {
                  borderRadius: 10,
                  columnWidth: '40%'
                }
              }
            }
          },
          {
            breakpoint: 1300,
            options: {
              plotOptions: {
                bar: {
                  borderRadius: 10,
                  columnWidth: '45%'
                }
              }
            }
          }
        ],
        states: {
          hover: {
            filter: {
              type: 'none'
            }
          },
          active: {
            filter: {
              type: 'none'
            }
          }
        }
      };

      // Render the chart
      if (totalRevenueChartEl !== null) {
        const totalRevenueChart = new ApexCharts(totalRevenueChartEl, totalRevenueChartOptions);
        totalRevenueChart.render();
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  });
  // Growth Chart - Radial Bar Chart
  // --------------------------------------------------------------------
  const growthChartEl = document.querySelector('#growthChart'),
    growthChartOptions = {
      series: [78],
      labels: ['Growth'],
      chart: {
        height: 240,
        type: 'radialBar'
      },
      plotOptions: {
        radialBar: {
          size: 150,
          offsetY: 10,
          startAngle: -150,
          endAngle: 150,
          hollow: {
            size: '55%'
          },
          track: {
            background: cardColor,
            strokeWidth: '100%'
          },
          dataLabels: {
            name: {
              offsetY: 15,
              color: legendColor,
              fontSize: '15px',
              fontWeight: '500',
              fontFamily: 'Public Sans'
            },
            value: {
              offsetY: -25,
              color: headingColor,
              fontSize: '22px',
              fontWeight: '500',
              fontFamily: 'Public Sans'
            }
          }
        }
      },
      colors: [config.colors.primary],
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          shadeIntensity: 0.5,
          gradientToColors: [config.colors.primary],
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 0.6,
          stops: [30, 70, 100]
        }
      },
      stroke: {
        dashArray: 5
      },
      grid: {
        padding: {
          top: -35,
          bottom: -10
        }
      },
      states: {
        hover: {
          filter: {
            type: 'none'
          }
        },
        active: {
          filter: {
            type: 'none'
          }
        }
      }
    };
  if (typeof growthChartEl !== undefined && growthChartEl !== null) {
    const growthChart = new ApexCharts(growthChartEl, growthChartOptions);
    growthChart.render();
  }

  // // Revenue Bar Chart
  // // --------------------------------------------------------------------
  // const revenueBarChartEl = document.querySelector('#revenueChart'),
  //   revenueBarChartConfig = {
  //     chart: {
  //       height: 95,
  //       type: 'bar',
  //       toolbar: {
  //         show: false
  //       }
  //     },
  //     plotOptions: {
  //       bar: {
  //         barHeight: '80%',
  //         columnWidth: '75%',
  //         startingShape: 'rounded',
  //         endingShape: 'rounded',
  //         borderRadius: 4,
  //         distributed: true
  //       }
  //     },
  //     grid: {
  //       show: false,
  //       padding: {
  //         top: -20,
  //         bottom: -12,
  //         left: -10,
  //         right: 0
  //       }
  //     },
  //     colors: [
  //       config.colors.primary,
  //       config.colors.primary,
  //       config.colors.primary,
  //       config.colors.primary,
  //       config.colors.primary,
  //       config.colors.primary,
  //       config.colors.primary
  //     ],
  //     dataLabels: {
  //       enabled: false
  //     },
  //     series: [
  //       {
  //         data: [40, 95, 60, 45, 90, 50, 75]
  //       }
  //     ],
  //     legend: {
  //       show: false
  //     },
  //     xaxis: {
  //       categories: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  //       axisBorder: {
  //         show: false
  //       },
  //       axisTicks: {
  //         show: false
  //       },
  //       labels: {
  //         style: {
  //           colors: labelColor,
  //           fontSize: '13px'
  //         }
  //       }
  //     },
  //     yaxis: {
  //       labels: {
  //         show: false
  //       }
  //     }
  //   };
  // if (typeof revenueBarChartEl !== undefined && revenueBarChartEl !== null) {
  //   const revenueBarChart = new ApexCharts(revenueBarChartEl, revenueBarChartConfig);
  //   revenueBarChart.render();
  // }

  // Profit Report Line Chart
  // --------------------------------------------------------------------
  const profileReportChartEl = document.querySelector('#profileReportChart'),
    profileReportChartConfig = {
      chart: {
        height: 75,
        // width: 175,
        type: 'line',
        toolbar: {
          show: false
        },
        dropShadow: {
          enabled: true,
          top: 10,
          left: 5,
          blur: 3,
          color: config.colors.warning,
          opacity: 0.15
        },
        sparkline: {
          enabled: true
        }
      },
      grid: {
        show: false,
        padding: {
          right: 8
        }
      },
      colors: [config.colors.warning],
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: 5,
        curve: 'smooth'
      },
      series: [
        {
          data: [110, 270, 145, 245, 205, 285]
        }
      ],
      xaxis: {
        show: false,
        lines: {
          show: false
        },
        labels: {
          show: false
        },
        axisBorder: {
          show: false
        }
      },
      yaxis: {
        show: false
      }
    };
  if (typeof profileReportChartEl !== undefined && profileReportChartEl !== null) {
    const profileReportChart = new ApexCharts(profileReportChartEl, profileReportChartConfig);
    profileReportChart.render();
  }

  // Order Statistics Chart
  // --------------------------------------------------------------------
  const chartOrderStatistics = document.querySelector('#orderStatisticsChart'),
    orderChartConfig = {
      chart: {
        height: 145,
        width: 110,
        type: 'donut'
      },
      labels: ['Electronic', 'Sports', 'Decor', 'Fashion'],
      series: [50, 85, 25, 40],
      colors: [config.colors.success, config.colors.primary, config.colors.secondary, config.colors.info],
      stroke: {
        width: 5,
        colors: [cardColor]
      },
      dataLabels: {
        enabled: false,
        formatter: function (val, opt) {
          return parseInt(val) + '%';
        }
      },
      legend: {
        show: false
      },
      grid: {
        padding: {
          top: 0,
          bottom: 0,
          right: 15
        }
      },
      states: {
        hover: {
          filter: { type: 'none' }
        },
        active: {
          filter: { type: 'none' }
        }
      },
      plotOptions: {
        pie: {
          donut: {
            size: '75%',
            labels: {
              show: true,
              value: {
                fontSize: '18px',
                fontFamily: 'Public Sans',
                fontWeight: 500,
                color: headingColor,
                offsetY: -17,
                formatter: function (val) {
                  return parseInt(val) + '%';
                }
              },
              name: {
                offsetY: 17,
                fontFamily: 'Public Sans'
              },
              total: {
                show: true,
                fontSize: '13px',
                color: legendColor,
                label: 'Weekly',
                formatter: function (w) {
                  return '38%';
                }
              }
            }
          }
        }
      }
    };
  if (typeof chartOrderStatistics !== undefined && chartOrderStatistics !== null) {
    const statisticsChart = new ApexCharts(chartOrderStatistics, orderChartConfig);
    statisticsChart.render();
  }

  // Income Chart - Area chart
  // --------------------------------------------------------------------
  const incomeChartEl = document.querySelector('#incomeChart'),
    incomeChartConfig = {
      series: [
        {
          data: [21, 30, 22, 42, 26, 35, 29]
        }
      ],
      chart: {
        height: 232,
        parentHeightOffset: 0,
        parentWidthOffset: 0,
        toolbar: {
          show: false
        },
        type: 'area'
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: 3,
        curve: 'smooth'
      },
      legend: {
        show: false
      },
      markers: {
        size: 6,
        colors: 'transparent',
        strokeColors: 'transparent',
        strokeWidth: 4,
        discrete: [
          {
            fillColor: config.colors.white,
            seriesIndex: 0,
            dataPointIndex: 6,
            strokeColor: config.colors.primary,
            strokeWidth: 2,
            size: 6,
            radius: 8
          }
        ],
        hover: {
          size: 7
        }
      },
      colors: [config.colors.primary],
      fill: {
        type: 'gradient',
        gradient: {
          shade: shadeColor,
          shadeIntensity: 0.6,
          opacityFrom: 0.5,
          opacityTo: 0.25,
          stops: [0, 95, 100]
        }
      },
      grid: {
        borderColor: borderColor,
        strokeDashArray: 8,
        padding: {
          top: -20,
          bottom: -8,
          left: 0,
          right: 8
        }
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        },
        labels: {
          show: true,
          style: {
            fontSize: '13px',
            colors: labelColor
          }
        }
      },
      yaxis: {
        labels: {
          show: false
        },
        min: 10,
        max: 50,
        tickAmount: 4
      }
    };
  if (typeof incomeChartEl !== undefined && incomeChartEl !== null) {
    const incomeChart = new ApexCharts(incomeChartEl, incomeChartConfig);
    incomeChart.render();
  }

  // Expenses Mini Chart - Radial Chart
  // --------------------------------------------------------------------
  const weeklyExpensesEl = document.querySelector('#expensesOfWeek'),
    weeklyExpensesConfig = {
      series: [65],
      chart: {
        width: 60,
        height: 60,
        type: 'radialBar'
      },
      plotOptions: {
        radialBar: {
          startAngle: 0,
          endAngle: 360,
          strokeWidth: '8',
          hollow: {
            margin: 2,
            size: '40%'
          },
          track: {
            background: borderColor
          },
          dataLabels: {
            show: true,
            name: {
              show: false
            },
            value: {
              formatter: function (val) {
                return '$' + parseInt(val);
              },
              offsetY: 5,
              color: legendColor,
              fontSize: '12px',
              fontFamily: 'Public Sans',
              show: true
            }
          }
        }
      },
      fill: {
        type: 'solid',
        colors: config.colors.primary
      },
      stroke: {
        lineCap: 'round'
      },
      grid: {
        padding: {
          top: -10,
          bottom: -15,
          left: -10,
          right: -10
        }
      },
      states: {
        hover: {
          filter: {
            type: 'none'
          }
        },
        active: {
          filter: {
            type: 'none'
          }
        }
      }
    };
  if (typeof weeklyExpensesEl !== undefined && weeklyExpensesEl !== null) {
    const weeklyExpenses = new ApexCharts(weeklyExpensesEl, weeklyExpensesConfig);
    weeklyExpenses.render();
  }
})();
