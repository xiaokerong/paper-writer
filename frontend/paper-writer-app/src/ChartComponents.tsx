import { AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart as RPieChart, Pie, Cell
} from 'recharts';
import type { TrendPoint, TopicCompareItem, SubjectDist } from './types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
const RISK_COLORS: Record<string, string> = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };

export function TrendLineChart({ data, height = 280 }: { data: TrendPoint[]; height?: number }) {
  if (!data || data.length === 0) return <div className="text-xs text-paper-muted text-center py-8">暂无数据</div>;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/></linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
        <XAxis dataKey="year" stroke="#64748b" fontSize={11}/>
        <YAxis stroke="#64748b" fontSize={11}/>
        <Tooltip contentStyle={{background:'#0f172a',border:'1px solid #334155',borderRadius:'8px',fontSize:'12px'}}/>
        <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#tg)" name="发文量"/>
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TopicRadarChart({ data, axes, height = 300 }: { data: TopicCompareItem[]; axes: string[]; height?: number }) {
  const chartData = axes.map(axis => {
    const item: Record<string, any> = { metric: axis };
    data.forEach(d => { item[d.topic] = d.metrics[axis] || 0; });
    return item;
  });
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
        <PolarGrid stroke="#334155"/>
        <PolarAngleAxis dataKey="metric" stroke="#94a3b8" fontSize={11}/>
        <PolarRadiusAxis angle={30} domain={[0,100]} stroke="#64748b" fontSize={10}/>
        {data.map((d, i) => <Radar key={d.topic} name={d.topic} dataKey={d.topic} stroke={COLORS[i%COLORS.length]} fill={COLORS[i%COLORS.length]} fillOpacity={0.15} strokeWidth={2}/>)}
        <Legend wrapperStyle={{fontSize:'11px'}}/>
        <Tooltip contentStyle={{background:'#0f172a',border:'1px solid #334155',borderRadius:'8px',fontSize:'12px'}}/>
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function SingleTopicRadar({ metrics, height = 280 }: { metrics: Record<string, number>; height?: number }) {
  const axes = Object.entries(metrics).map(([key, val]) => {
    const label = key === 'research_heat' ? '研究热度' : key === 'innovation_score' ? '创新空间' : key === 'data_availability' ? '数据可得性' : key === 'practical_value' ? '实践价值' : key === 'method_maturity' ? '方法成熟度' : key;
    return { metric: label, value: val };
  });
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={axes} margin={{ top: 10, right: 30, bottom: 20, left: 30 }}>
        <PolarGrid stroke="#334155"/>
        <PolarAngleAxis dataKey="metric" stroke="#94a3b8" fontSize={11}/>
        <PolarRadiusAxis angle={30} domain={[0,100]} stroke="#64748b" fontSize={10}/>
        <Radar name="评分" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2}/>
        <Tooltip contentStyle={{background:'#0f172a',border:'1px solid #334155',borderRadius:'8px',fontSize:'12px'}}/>
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function SubjectPieChart({ data, height = 250 }: { data: SubjectDist[]; height?: number }) {
  if (!data || data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RPieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value" nameKey="name">
          {data.map((_, i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
        </Pie>
        <Tooltip contentStyle={{background:'#0f172a',border:'1px solid #334155',borderRadius:'8px',fontSize:'12px'}}/>
        <Legend wrapperStyle={{fontSize:'11px'}}/>
      </RPieChart>
    </ResponsiveContainer>
  );
}

export function GaugeChart({ score, size = 160 }: { score: number; size?: number }) {
  const radius = size / 2 - 10;
  const strokeWidth = 12;
  const n = Math.min(100, Math.max(0, score));
  const color = n >= 80 ? '#22c55e' : n >= 60 ? '#f59e0b' : '#ef4444';
  const circ = Math.PI * radius;
  const filled = (n / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size/2+20} viewBox={`0 0 ${size} ${size/2+20}`}>
        <path d={`M ${strokeWidth} ${size/2} A ${radius} ${radius} 0 0 1 ${size-strokeWidth} ${size/2}`} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} strokeLinecap="round"/>
        <path d={`M ${strokeWidth} ${size/2} A ${radius} ${radius} 0 0 1 ${size-strokeWidth} ${size/2}`} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={`${filled} ${circ}`} style={{transition:'stroke-dasharray 0.6s ease'}}/>
        <text x={size/2} y={size/2-5} textAnchor="middle" fill="white" fontSize={size/5} fontWeight="bold">{n}</text>
        <text x={size/2} y={size/2+10} textAnchor="middle" fill="#94a3b8" fontSize={size/10}>/100 原创度</text>
      </svg>
    </div>
  );
}

export function RiskBar({ score, risk, text }: { score: number; risk: string; text: string }) {
  const color = RISK_COLORS[risk] || '#94a3b8';
  const label = risk === 'high' ? '高风险' : risk === 'medium' ? '中风险' : '低风险';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-paper-muted truncate flex-1 mr-2">{text.slice(0,60)}{text.length>60?'...':''}</span>
        <span className="font-medium" style={{color}}>{score}分·{label}</span>
      </div>
      <div className="h-2 bg-paper-card rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{width:`${score}%`,backgroundColor:color}}/>
      </div>
    </div>
  );
}

export function RiskPieChart({ segments }: { segments: Array<{ risk: string; count: number }> }) {
  const total = segments.reduce((s,seg) => s+seg.count, 0) || 1;
  const data = segments.map(seg => ({
    name: seg.risk==='high'?'高风险':seg.risk==='medium'?'中风险':'低风险',
    value: seg.count,
    color: RISK_COLORS[seg.risk]||'#94a3b8',
  }));
  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={120} height={120}>
        <RPieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={28} outerRadius={48} paddingAngle={2} dataKey="value">
            {data.map((d,i)=><Cell key={i} fill={d.color}/>)}
          </Pie>
          <Tooltip contentStyle={{background:'#0f172a',border:'1px solid #334155',borderRadius:'8px',fontSize:'11px'}}/>
        </RPieChart>
      </ResponsiveContainer>
      <div className="space-y-1.5">
        {data.map(d=>(<div key={d.name} className="flex items-center gap-2 text-[10px]"><div className="w-2.5 h-2.5 rounded-sm" style={{backgroundColor:d.color}}/><span className="text-paper-muted">{d.name}</span><span className="text-white font-medium">{d.value}段</span><span className="text-paper-muted">({((d.value/total)*100).toFixed(0)}%)</span></div>))}
        <div className="text-[10px] text-paper-muted pt-0.5">共{total}段落</div>
      </div>
    </div>
  );
}
