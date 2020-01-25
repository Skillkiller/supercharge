/** @format */

import { Component, OnInit, Inject } from '@angular/core';
import { IAPIService } from 'src/app/services/api/api.interface';
import { StateService } from 'src/app/services/state/state.service';
import { ActivatedRoute } from '@angular/router';
import { SummonerModel } from 'src/app/models/summoner.model';
import { ChartOptions, ChartDataSets, ChartData } from 'chart.js';
import { Label } from 'ng2-charts';
import { StatsModel } from 'src/app/models/stats.model';

@Component({
  selector: 'app-details-route',
  templateUrl: './details-route.component.html',
  styleUrls: ['./details-route.component.scss'],
})
export class DetailsRouteComponent implements OnInit {
  public summonerName: string;
  public summoner: SummonerModel;
  public stats: StatsModel[];

  public barChartOptions: ChartOptions = {
    responsive: true,
    legend: {
      display: true,
    },
    scales: {
      xAxes: [
        {
          type: 'time',
          time: {
            unit: 'day',
          },
        },
      ],
    },
  };
  public barChartLabels: Label[] = [];
  public barChartData: ChartDataSets[] = [{ data: [] }];

  public lastUpdated: Date;
  public isData: boolean;

  constructor(
    @Inject('APIService') private api: IAPIService,
    private state: StateService,
    private route: ActivatedRoute
  ) {}

  public ngOnInit() {
    this.route.params.subscribe((params) => {
      this.summonerName = params.summonerName;
      this.summoner = this.state.currentSummoner;

      this.api
        .getSummonerStats(this.state.server, this.summonerName)
        .subscribe((stats) => {
          this.stats = stats;
          this.initChart();
        });

      if (!this.summoner || this.summoner.name !== this.summonerName) {
        this.api
          .getSummoner(this.state.server, params.summonerName)
          .subscribe((summoner) => {
            this.summoner = summoner;
          });
      }

      if (!this.state.initialized) {
        this.state.initialized.subscribe(() => {});
      } else {
      }
    });
  }

  private initChart() {
    const champs = this.stats
      .slice(0, 3)
      .map((stat) => stat.championId.toString(10));
    this.fetchHistory(champs);
  }

  private fetchHistory(champions: string[] = [], from?: Date, to?: Date) {
    this.api
      .getSummonerHistory(
        this.state.server,
        this.summonerName,
        champions,
        from,
        to
      )
      .subscribe((history) => {
        const champs = new Set<number>();

        history.forEach((h) => champs.add(h.championId));

        this.barChartData = Array.from(champs).map(
          (cid) =>
            ({
              data: history
                .filter((h) => h.championId === cid)
                .map((h) => ({
                  x: new Date(h.timestamp),
                  y: h.championPoints,
                })),
              label: this.state.championsMap[cid].name,
            } as ChartDataSets)
        );
      });
  }
}
