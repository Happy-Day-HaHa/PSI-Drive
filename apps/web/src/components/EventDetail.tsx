"use client";

import { useEffect, useRef, useState } from "react";
import { FootView } from "@/components/FootView";
import { MobileDriveWorkspace } from "@/components/MobileDriveWorkspace";
import { PedalEventIcon, pedalActionLabel } from "@/components/PedalEventIcon";
import { PauseIcon, PinIcon, PlayIcon } from "@/components/Icons";
import { ChartLegend } from "@/components/LineChart";
import { TimeChart } from "@/components/TimeChart";
import { Panel, PanelHeader, Stat } from "@/components/ui";
import { analyzeEvent } from "@/lib/event-analysis";
import {
  ACCEL_COLOR,
  BRAKE_COLOR,
  SAMPLE_DT_MS,
  compareToAverage,
  eventFindings,
  eventHeadline,
  eventLocation,
  eventTypeLabels,
  formatMs,
  pedalSamples,
  stepInfo,
  type PedalEvent,
} from "@/lib/pedal";

const RATES = [0.5, 1, 1.5];
const findingTone = {
  good: { label: "잘한 점", className: "bg-good-soft text-good" },
  watch: { label: "살펴볼 점", className: "bg-caution-soft text-caution" },
  info: { label: "참고", className: "bg-canvas text-muted" },
};

function interpolateSample(values: number[], playheadMs: number) {
  const position = playheadMs / SAMPLE_DT_MS;
  const before = Math.min(Math.floor(position), values.length - 1);
  const after = Math.min(before + 1, values.length - 1);
  const progress = position - before;
  return values[before] + (values[after] - values[before]) * progress;
}

function comparisonStat(label: string, value: number, average: number) {
  const comparison = compareToAverage(value, average);
  return (
    <Stat
      label={label}
      value={value.toLocaleString("ko-KR")}
      unit="ms"
      note={comparison.text}
      noteTone={comparison.better === null ? "muted" : comparison.better ? "good" : "alert"}
    />
  );
}

export function EventDetail({ event }: { event: PedalEvent }) {
  const { series, marks, metrics, stats } = event;
  const durationMs = (series.accel.length - 1) * SAMPLE_DT_MS;
  const zeroMark = marks.find((mark) => mark.key === "T0" || mark.key === "T2" || mark.key === "O0");
  const zeroMs = zeroMark?.ms ?? 0;
  const [playheadMs, setPlayheadMs] = useState(zeroMs);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(0.5);
  const [highlight, setHighlight] = useState<string | null>(null);
  const position = useRef(playheadMs);
  position.current = playheadMs;

  useEffect(() => {
    if (!playing) return;
    let previous = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const next = position.current + (now - previous) * rate;
      previous = now;
      if (next >= durationMs) {
        setPlayheadMs(durationMs);
        setPlaying(false);
        return;
      }
      setPlayheadMs(next);
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [playing, rate, durationMs]);

  const accel = interpolateSample(series.accel, playheadMs);
  const brake = interpolateSample(series.brake, playheadMs);
  const foot = interpolateSample(series.foot, playheadMs);
  const speed = interpolateSample(series.speedKmh, playheadMs);
  const decel = interpolateSample(series.decelG, playheadMs);
  const elapsed = Math.round(playheadMs - zeroMs);
  const zeroName = zeroMark ? stepInfo[zeroMark.key].title : "시작";
  const steps = [...marks].sort((a, b) => a.ms - b.ms);
  const currentStep = steps.filter((mark) => mark.ms <= playheadMs).pop();
  const markAt = (key: string) => marks.find((mark) => mark.key === key)?.ms;
  const t2 = markAt("T2");
  const t4 = markAt("T4");
  const o0 = markAt("O0");
  const o1 = markAt("O1");
  const bands = [
    ...(t2 !== undefined && t4 !== undefined ? [{ from: t2, to: t4, color: "rgba(217,119,6,0.09)" }] : []),
    ...(o0 !== undefined && o1 !== undefined ? [{ from: o0, to: o1, color: "rgba(124,58,237,0.1)" }] : []),
  ];
  const maxSpeed = Math.max(...series.speedKmh);
  const speedTop = Math.max(Math.ceil(maxSpeed / 20) * 20, 20);
  const averages = pedalSamples.averages;
  const isHazard = event.type === "pedestrian" || event.type === "lead_brake";
  const findings = eventFindings(event);
  const analysis = analyzeEvent(event);

  const jumpTo = (key: string, ms: number) => {
    setPlaying(false);
    setHighlight(key);
    setPlayheadMs(ms);
  };

  return (
    <div className="h-full min-h-0 min-w-0 space-y-5 overflow-hidden xl:h-auto xl:overflow-visible">
      <MobileDriveWorkspace
        event={event}
        accel={accel}
        brake={brake}
        foot={foot}
        playheadMs={playheadMs}
        durationMs={durationMs}
        elapsed={elapsed}
        playing={playing}
        rate={rate}
        steps={steps}
        activeKey={currentStep?.key ?? null}
        selectedKey={highlight}
        onToggle={() => {
          if (playheadMs >= durationMs) setPlayheadMs(0);
          setHighlight(null);
          setPlaying((current) => !current);
        }}
        onScrub={(ms) => {
          setPlaying(false);
          setHighlight(null);
          setPlayheadMs(ms);
        }}
        onRate={setRate}
        onJump={jumpTo}
      />

      <Panel className="hidden xl:block">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] text-muted">
              {event.id} · {event.date} {event.time}
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">{eventTypeLabels[event.type]}</h2>
            <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-muted">
              <PinIcon className="size-4 text-brand" />{eventLocation(event)}
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-brand">
              <PedalEventIcon type={event.type} className="h-10 w-[61px]" />
              <span>
                <span className="block text-[10px] tracking-[0.1em] text-muted uppercase">Detected foot action</span>
                {pedalActionLabel(event.type)}
              </span>
            </div>
          </div>
          {event.score !== null && (
            <div className="rounded-lg border border-line px-3.5 py-2 text-right">
              <p className="text-xs text-muted">반응 지표</p>
              <p className="text-xl font-bold">
                {event.score}
                <span className="ml-0.5 text-[13px] font-medium text-muted">점</span>
              </p>
            </div>
          )}
        </div>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed">{eventHeadline(event)}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-canvas px-3 py-2.5"><p className="text-[10px] text-muted">이벤트 분류</p><p className="mt-1 text-xs font-bold">{analysis.category} · {analysis.subtype}</p></div>
          <div className="rounded-xl bg-canvas px-3 py-2.5"><p className="text-[10px] text-muted">전방 상황 출처</p><p className="mt-1 text-xs font-bold">{analysis.frontSource}</p></div>
          <div className="rounded-xl bg-canvas px-3 py-2.5"><p className="text-[10px] text-muted">탐지 신뢰도</p><p className="mt-1 text-xs font-bold text-caution">미산출 · 검증 필요</p></div>
          <div className="rounded-xl bg-canvas px-3 py-2.5"><p className="text-[10px] text-muted">사용 데이터</p><p className="mt-1 truncate text-xs font-bold">{analysis.sources.join(" · ")}</p></div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-5 md:grid-cols-4">
          {isHazard && (
            <>
              {comparisonStat("인지-해제", metrics.recognitionMs ?? 0, averages.recognitionMs)}
              {comparisonStat("페달 전환", metrics.transitionMs ?? 0, averages.transitionMs)}
              {comparisonStat("총 제동 반응", metrics.totalReactionMs ?? 0, averages.totalReactionMs)}
              {comparisonStat("제동력 상승", metrics.riseMs ?? 0, averages.riseMs)}
            </>
          )}
          {event.type === "routine" && (
            <>
              <Stat label="타력 주행" value={((metrics.coastMs ?? 0) / 1000).toFixed(1)} unit="초" />
              <Stat label="제동력 상승" value={(metrics.riseMs ?? 0).toLocaleString("ko-KR")} unit="ms" />
              <Stat label="최대 제동 압력" value={`${Math.round(stats.peakBrakePct)}`} unit="%" />
              <Stat label="최대 감속" value={stats.peakDecelG.toFixed(2)} unit="g" />
            </>
          )}
          {event.type === "overlap" && (
            <>
              <Stat label="중첩 시간" value={(metrics.overlapMs ?? 0).toLocaleString("ko-KR")} unit="ms" />
              <Stat label="중첩 중 가속 압력" value={`${Math.round(stats.accelDuringPct ?? 0)}`} unit="%" />
              <Stat label="최대 제동 압력" value={`${Math.round(stats.peakBrakePct)}`} unit="%" />
              <Stat label="최대 감속" value={stats.peakDecelG.toFixed(2)} unit="g" />
            </>
          )}
        </dl>
      </Panel>

      <Panel className="hidden xl:block">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-[11px] font-bold tracking-[.13em] text-brand uppercase">Composite event flow</p><h2 className="mt-1 text-lg font-bold">상황과 조작의 시간적 흐름</h2><p className="mt-1 text-xs text-muted">영상 재현 없이 수집·계산 가능한 데이터만 표시합니다.</p></div>
          <span className="rounded-full bg-canvas px-2.5 py-1 text-[10px] font-bold text-muted">전방 영상 미연결</span>
        </div>
        <div className="mt-4 overflow-x-auto pb-1">
          <ol className="flex min-w-[680px] items-center">
            {steps.map((mark, index) => (
              <li key={mark.key} className="flex min-w-0 flex-1 items-center">
                <button type="button" onClick={() => jumpTo(mark.key, mark.ms)} className="group min-w-0 text-left">
                  <span className={`flex size-7 items-center justify-center rounded-full text-[9px] font-bold transition ${currentStep?.key === mark.key ? "bg-brand text-white shadow-[0_5px_14px_rgba(36,108,226,.22)]" : "bg-canvas text-muted group-hover:bg-[#eaf2ff] group-hover:text-brand"}`}>{mark.key}</span>
                  <span className="mt-1.5 block truncate text-[10px] font-semibold">{stepInfo[mark.key].title}</span>
                  <span className="mt-0.5 block text-[9px] text-muted tabular-nums">{formatMs(mark.ms - zeroMs)}</span>
                </button>
                {index < steps.length - 1 && <span aria-hidden className="mx-2 h-px flex-1 bg-line" />}
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4 md:grid-cols-4">
          <div className="rounded-lg bg-[#f8fafc] p-3"><p className="text-[10px] text-muted">장면 지속 시간</p><p className="mt-1 text-sm font-bold tabular-nums">{formatMs(analysis.durationMs)}</p></div>
          <div className="rounded-lg bg-[#f8fafc] p-3"><p className="text-[10px] text-muted">시작 → 종료 속도</p><p className="mt-1 text-sm font-bold tabular-nums">{Math.round(stats.speedStartKmh)} → {Math.round(stats.speedEndKmh)}km/h</p></div>
          <div className="rounded-lg bg-[#f8fafc] p-3"><p className="text-[10px] text-muted">최대 Jerk</p><p className="mt-1 text-sm font-bold tabular-nums">{analysis.maxJerkGPerS.toFixed(2)}g/s</p><p className="mt-0.5 text-[9px] text-muted">합성 IMU 계산값</p></div>
          <div className="rounded-lg bg-[#f8fafc] p-3"><p className="text-[10px] text-muted">데이터 품질</p><p className="mt-1 text-sm font-bold text-good">{analysis.quality}</p><p className="mt-0.5 text-[9px] text-muted">실제 동기화 오차 미산출</p></div>
        </div>
        <p className="mt-4 rounded-xl border border-[#dbe7f7] bg-[#f5f9ff] px-4 py-3 text-xs leading-relaxed text-muted"><b className="text-ink">시간적 연관 흐름:</b> {analysis.relationship}. 이 흐름은 관측된 데이터의 순서를 설명하며 운전자의 의도나 사고 원인을 확정하지 않습니다.</p>
      </Panel>

      <Panel className="hidden xl:block">
        <PanelHeader
          title="압력 센서 기록"
          description="재생하거나 그래프를 눌러 시점을 옮기면 발 위치와 페달 압력이 함께 움직입니다."
          action={<ChartLegend series={[{ name: "가속 페달", color: ACCEL_COLOR }, { name: "브레이크", color: BRAKE_COLOR }]} />}
        />
        <div className="hidden grid-cols-1 gap-6 xl:grid xl:grid-cols-[280px_minmax(0,1fr)]">
          <div className="rounded-xl bg-canvas p-3 sm:p-4">
            <FootView accel={accel} brake={brake} foot={foot} />
            <div className="mt-3 border-t border-line pt-3">
              <p className="text-xs text-muted">현재 단계</p>
              {currentStep ? (
                <>
                  <p className="mt-0.5 text-sm font-bold">
                    {currentStep.key} {stepInfo[currentStep.key].title}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{stepInfo[currentStep.key].body}</p>
                </>
              ) : (
                <p className="mt-0.5 text-sm font-bold">장면 직전 주행</p>
              )}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-[13px]">
              <div>
                <dt className="text-muted">속도</dt>
                <dd className="font-bold tabular-nums">{Math.round(speed)} km/h</dd>
              </div>
              <div>
                <dt className="text-muted">종가속도</dt>
                <dd className="font-bold tabular-nums">{decel.toFixed(2)} g</dd>
              </div>
            </dl>
          </div>
          <div className="min-w-0 space-y-2">
            <TimeChart
              title="페달 압력 (%)"
              ariaLabel={`가속 페달과 브레이크 압력 그래프. 최대 제동 압력 ${Math.round(stats.peakBrakePct)}%`}
              dtMs={SAMPLE_DT_MS}
              series={[
                { key: "accel", values: series.accel, color: ACCEL_COLOR },
                { key: "brake", values: series.brake, color: BRAKE_COLOR },
              ]}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              height={190}
              marks={marks}
              zeroMs={zeroMs}
              playheadMs={playheadMs}
              onScrub={(ms) => {
                setPlaying(false);
                setPlayheadMs(ms);
              }}
              showMarkLabels
              bands={bands}
              highlightKey={highlight}
            />
            <TimeChart
              title="속도 (km/h)"
              ariaLabel={`차량 속도 그래프. 시작 ${Math.round(stats.speedStartKmh)}km/h`}
              dtMs={SAMPLE_DT_MS}
              series={[{ key: "speed", values: series.speedKmh, color: "#475569" }]}
              domain={[0, speedTop]}
              ticks={[0, speedTop]}
              height={56}
              marks={marks}
              zeroMs={zeroMs}
              playheadMs={playheadMs}
              onScrub={(ms) => {
                setPlaying(false);
                setPlayheadMs(ms);
              }}
              bands={bands}
              highlightKey={highlight}
            />
            <TimeChart
              title="종가속도 (g)"
              ariaLabel={`차량 종가속도 그래프. 최대 감속 ${stats.peakDecelG.toFixed(2)}g`}
              dtMs={SAMPLE_DT_MS}
              series={[{ key: "decel", values: series.decelG, color: "#475569" }]}
              domain={[-1, 0.5]}
              ticks={[-1, 0]}
              height={56}
              marks={marks}
              zeroMs={zeroMs}
              playheadMs={playheadMs}
              onScrub={(ms) => {
                setPlaying(false);
                setPlayheadMs(ms);
              }}
              showTimeAxis
              bands={bands}
              highlightKey={highlight}
            />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (playheadMs >= durationMs) setPlayheadMs(0);
                  setHighlight(null);
                  setPlaying((current) => !current);
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-[13px] font-semibold text-white outline-offset-2 outline-brand transition-colors hover:bg-brand-hover focus-visible:outline-2"
              >
                {playing ? <PauseIcon className="size-3.5" /> : <PlayIcon className="size-3.5" />}
                {playing ? "일시정지" : "재생"}
              </button>
              <div role="group" aria-label="재생 속도" className="flex overflow-hidden rounded-md border border-line">
                {RATES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={rate === value}
                    onClick={() => setRate(value)}
                    className={`px-2.5 py-1.5 text-xs font-medium tabular-nums ${rate === value ? "bg-track text-ink" : "bg-card text-muted hover:text-ink"}`}
                  >
                    {value}배
                  </button>
                ))}
              </div>
              <input
                type="range"
                min={0}
                max={durationMs}
                step={SAMPLE_DT_MS}
                value={Math.round(playheadMs)}
                onChange={(input) => {
                  setPlaying(false);
                  setPlayheadMs(Number(input.target.value));
                }}
                aria-label="재생 위치"
                aria-valuetext={`${zeroName} 기준 ${elapsed}ms`}
                className="min-w-40 flex-1 accent-brand"
              />
              <span className="text-[13px] whitespace-nowrap text-muted tabular-nums">
                {zeroName} {elapsed >= 0 ? "+" : "−"}
                {Math.abs(elapsed).toLocaleString("ko-KR")}ms
              </span>
            </div>
          </div>
        </div>
        {bands.length > 0 && (
          <p className="mt-3 text-xs text-muted">
            {t2 !== undefined && t4 !== undefined ? "옅은 주황색 구간은 가속 페달을 뗀 뒤 브레이크에 닿기까지입니다." : "옅은 보라색 구간은 두 페달을 함께 밟은 구간입니다."}
          </p>
        )}
      </Panel>

      <div className="hidden gap-5 xl:grid xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel>
          <PanelHeader title="발 움직임 단계" description="항목을 누르면 위 그래프의 해당 시점으로 이동합니다." />
          <ol>
            {steps.map((mark, stepIndex) => {
              const info = stepInfo[mark.key];
              const fromZero = mark.ms - zeroMs;
              const previous = steps[stepIndex - 1];
              return (
                <li key={mark.key} className="border-t border-line first:border-t-0">
                  <button
                    type="button"
                    onClick={() => jumpTo(mark.key, mark.ms)}
                    aria-current={highlight === mark.key ? "step" : undefined}
                    className={`grid w-full grid-cols-[38px_minmax(0,1fr)_auto] items-start gap-2 rounded-md px-1.5 py-2.5 text-left transition-colors hover:bg-canvas ${highlight === mark.key ? "bg-canvas" : ""}`}
                  >
                    <span className="mt-0.5 rounded border border-line bg-card py-0.5 text-center text-xs font-bold">{mark.key}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{info.title}</span>
                      <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">{info.body}</span>
                      <span className="mt-0.5 block text-xs text-muted/90">
                        {info.source}
                        {info.source.includes("영상") && " · ±17ms 불확실성"}
                      </span>
                    </span>
                    <span className="text-right tabular-nums">
                      <span className="block text-sm font-bold">
                        {fromZero === 0 ? "기준" : `${fromZero > 0 ? "+" : "−"}${formatMs(Math.abs(fromZero))}`}
                      </span>
                      {previous && <span className="block text-xs text-muted">이전 단계 +{formatMs(mark.ms - previous.ms)}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </Panel>

        <Panel>
          <PanelHeader title="이번 장면 돌아보기" description={isHazard ? `주의 장면 ${pedalSamples.scope.hazardEvents}개의 평균과 비교했습니다.` : "이번 조작의 특징입니다."} />
          <ul className="space-y-3">
            {findings.map((finding) => (
              <li key={finding.text} className="flex flex-col items-start gap-1.5">
                <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${findingTone[finding.kind].className}`}>{findingTone[finding.kind].label}</span>
                <p className="text-sm leading-relaxed">{finding.text}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">시작 속도</dt>
              <dd className="font-medium tabular-nums">{Math.round(stats.speedStartKmh)} km/h</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">종료 속도</dt>
              <dd className="font-medium tabular-nums">{Math.round(stats.speedEndKmh)} km/h</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">최대 제동 압력</dt>
              <dd className="font-medium tabular-nums">{Math.round(stats.peakBrakePct)}%</dd>
            </div>
            {stats.accelBeforePct !== undefined && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">주의 상황 직전 가속 압력</dt>
                <dd className="font-medium tabular-nums">{Math.round(stats.accelBeforePct)}%</dd>
              </div>
            )}
            {metrics.vehicleDelayMs !== undefined && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">차량 반응 지연</dt>
                <dd className="font-medium tabular-nums">{formatMs(metrics.vehicleDelayMs)}</dd>
              </div>
            )}
          </dl>
        </Panel>
      </div>
    </div>
  );
}
