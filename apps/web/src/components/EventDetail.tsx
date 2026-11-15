"use client";

import { useEffect, useRef, useState } from "react";
import { FootView } from "@/components/FootView";
import { MobileDriveWorkspace } from "@/components/MobileDriveWorkspace";
import { PauseIcon, PlayIcon } from "@/components/Icons";
import { TimeChart } from "@/components/TimeChart";
import { Panel, PanelHeader } from "@/components/ui";
import {
  ACCEL_COLOR,
  BRAKE_COLOR,
  SAMPLE_DT_MS,
  eventFindings,
  eventHeadline,
  eventTypeLabels,
  formatMs,
  stepInfo,
  type PedalEvent,
} from "@/lib/pedal";

const RATES = [0.5, 1, 1.5];

function interpolateSample(values: number[], playheadMs: number) {
  const position = playheadMs / SAMPLE_DT_MS;
  const before = Math.min(Math.floor(position), values.length - 1);
  const after = Math.min(before + 1, values.length - 1);
  const progress = position - before;
  return values[before] + (values[after] - values[before]) * progress;
}

function scoreTone(score: number | null) {
  return score === null ? "bg-track text-muted" : "bg-[#eaf2fd] text-brand";
}

export function EventDetail({ event }: { event: PedalEvent }) {
  const { series, marks, stats } = event;
  const durationMs = (series.accel.length - 1) * SAMPLE_DT_MS;
  const zeroMark = marks.find((mark) => mark.key === "T0" || mark.key === "T2" || mark.key === "O0" || mark.key === "A0");
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
  const elapsed = Math.round(playheadMs - zeroMs);
  const steps = [...marks].sort((a, b) => a.ms - b.ms);
  const currentStep = steps.filter((mark) => mark.ms <= playheadMs).pop();
  const findings = eventFindings(event);
  const t2 = marks.find((mark) => mark.key === "T2")?.ms;
  const t4 = marks.find((mark) => mark.key === "T4")?.ms;
  const o0 = marks.find((mark) => mark.key === "O0")?.ms;
  const o1 = marks.find((mark) => mark.key === "O1")?.ms;
  const bands = [
    ...(t2 !== undefined && t4 !== undefined ? [{ from: t2, to: t4, color: "rgba(217,119,6,0.09)" }] : []),
    ...(o0 !== undefined && o1 !== undefined ? [{ from: o0, to: o1, color: "rgba(124,58,237,0.1)" }] : []),
  ];
  const speedTop = Math.max(Math.ceil(Math.max(...series.speedKmh) / 20) * 20, 20);

  const jumpTo = (key: string, ms: number) => {
    setPlaying(false);
    setHighlight(key);
    setPlayheadMs(ms);
  };

  return (
    <div className="h-full min-h-0 min-w-0 space-y-5 overflow-hidden lg:h-auto lg:overflow-visible">
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

      <Panel className="hidden lg:block">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold text-brand">{event.date} {event.time} · 시연용 사건일</p>
            <h2 className="mt-1 text-xl font-extrabold">{eventTypeLabels[event.type]}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{eventHeadline(event)}</p>
          </div>
          <span className={`rounded-full px-3 py-2 text-sm font-extrabold ${scoreTone(event.score)}`}>{event.score === null ? "점수 없음" : `${event.score}점`}</span>
        </div>
        <div className="mt-4 rounded-xl bg-track p-4">
          <p className="text-xs font-bold text-brand">그래프 해석</p>
          <p className="mt-1 text-sm leading-relaxed">{findings[0]?.text ?? "이 장면의 페달 압력과 속도 변화를 함께 확인할 수 있습니다."}</p>
        </div>
      </Panel>

      <Panel className="hidden lg:block">
        <PanelHeader title="발 움직임과 페달 압력" description={`${event.date} ${event.time} · 재생 막대를 움직여 같은 시점의 발 위치와 그래프를 확인하세요.`} />
        <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-[#d7e5f8] bg-[#f4f8fe] px-3 py-2" role="note" aria-label={`그래프 기준 날짜 ${event.date} ${event.time}`}>
          <span className="text-[10px] font-extrabold tracking-[.08em] text-brand uppercase">그래프 기준 날짜</span>
          <strong className="text-xs tabular-nums text-ink">{event.date} {event.time}</strong>
          <span className="text-[11px] text-muted">시연용 사건일</span>
        </div>
        <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
          <div>
            <FootView accel={accel} brake={brake} foot={foot} />
            <div className="mt-3 rounded-xl border border-line bg-canvas p-3">
              <div className="flex items-center gap-2">
                <button type="button" aria-label={playing ? "일시 정지" : "재생"} onClick={() => {
                  if (playheadMs >= durationMs) setPlayheadMs(0);
                  setHighlight(null);
                  setPlaying((current) => !current);
                }} className="flex size-9 items-center justify-center rounded-full bg-brand text-white">
                  {playing ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
                </button>
                <input aria-label="장면 재생 위치" type="range" min={0} max={durationMs} step={SAMPLE_DT_MS} value={Math.round(playheadMs)} onChange={(input) => {
                  setPlaying(false);
                  setHighlight(null);
                  setPlayheadMs(Number(input.target.value));
                }} className="min-w-0 flex-1 accent-brand" />
                <span className="w-16 text-right text-xs font-bold tabular-nums">{elapsed >= 0 ? "+" : ""}{elapsed}ms</span>
              </div>
              <div className="mt-2 flex justify-end gap-1">
                {RATES.map((item) => <button key={item} type="button" onClick={() => setRate(item)} className={`rounded-md px-2 py-1 text-[10px] font-bold ${rate === item ? "bg-brand text-white" : "bg-white text-muted"}`}>{item}×</button>)}
              </div>
            </div>
          </div>
          <div className="min-w-0 space-y-3">
            <TimeChart
              title="페달 압력 (%)"
              ariaLabel={`가속 페달과 브레이크 압력 그래프. ${event.date} ${event.time}, 최대 제동 압력 ${Math.round(stats.peakBrakePct)}%`}
              dtMs={SAMPLE_DT_MS}
              series={[{ key: "accel", values: series.accel, color: ACCEL_COLOR }, { key: "brake", values: series.brake, color: BRAKE_COLOR }]}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              height={190}
              marks={marks}
              zeroMs={zeroMs}
              playheadMs={playheadMs}
              onScrub={(ms) => { setPlaying(false); setPlayheadMs(ms); }}
              showMarkLabels
              bands={bands}
              highlightKey={highlight}
            />
            <p className="rounded-lg bg-track px-3 py-2 text-[11px] leading-relaxed text-muted"><b className="text-ink">그래프 읽기:</b> 페달 압력은 운전자의 입력이고 속도는 차량의 반응입니다. 브레이크 입력과 차량 관성 때문에 짧은 순간에는 두 값의 방향이 다를 수 있습니다.</p>
            <TimeChart
              title="속도 (km/h)"
              ariaLabel={`차량 속도 그래프. ${event.date} ${event.time}, 시작 ${Math.round(stats.speedStartKmh)}km/h`}
              dtMs={SAMPLE_DT_MS}
              series={[{ key: "speed", values: series.speedKmh, color: "#475569" }]}
              domain={[0, speedTop]}
              ticks={[0, speedTop]}
              height={72}
              marks={marks}
              zeroMs={zeroMs}
              playheadMs={playheadMs}
              onScrub={(ms) => { setPlaying(false); setPlayheadMs(ms); }}
              bands={bands}
              highlightKey={highlight}
            />
          </div>
        </div>
      </Panel>

      <details className="group hidden rounded-2xl border border-line bg-card shadow-[0_12px_32px_rgba(15,31,54,.04)] lg:block">
        <summary className="flex cursor-pointer list-none items-center justify-between p-5 marker:hidden">
          <div><h2 className="font-extrabold">상세 분석 보기</h2><p className="mt-1 text-xs text-muted">반응 단계와 장면 해석 확인</p></div>
          <span className="text-xs font-bold text-brand group-open:hidden">펼치기</span><span className="hidden text-xs font-bold text-brand group-open:inline">접기</span>
        </summary>
        <div className="space-y-5 border-t border-line p-5">
          <section>
            <h3 className="text-sm font-bold">반응 단계</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {steps.map((mark) => <button key={mark.key} type="button" onClick={() => jumpTo(mark.key, mark.ms)} className="rounded-xl border border-line bg-canvas p-3 text-left hover:border-brand">
                <span className="text-xs font-extrabold text-brand">{mark.key} · {formatMs(mark.ms - zeroMs)}</span>
                <span className="mt-1 block text-sm font-bold">{stepInfo[mark.key]?.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">{stepInfo[mark.key]?.body}</span>
              </button>)}
            </div>
          </section>
          <section>
            <h3 className="text-sm font-bold">모든 해석</h3>
            <ul className="mt-3 space-y-2">
              {findings.map((finding, index) => <li key={index} className="rounded-xl bg-track p-3 text-sm leading-relaxed">{finding.text}</li>)}
            </ul>
          </section>
        </div>
      </details>
    </div>
  );
}
