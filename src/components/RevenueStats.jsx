import { Card } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DollarSign, TrendingDown, TrendingUp, ShoppingBag, Package } from "lucide-react";

function Stat({ label, value, icon: Icon, tone }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${tone || "text-muted-foreground"}`} />
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </Card>
  );
}

export default function RevenueStats({ data }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat label="Gross Revenue" value={`$${data.gross.toFixed(2)}`} icon={DollarSign} tone="text-emerald-600" />
        <Stat label="Fees" value={`$${data.fees.toFixed(2)}`} icon={TrendingDown} tone="text-rose-600" />
        <Stat label="Net Profit" value={`$${data.net.toFixed(2)}`} icon={TrendingUp} tone="text-emerald-600" />
        <Stat label="Sales" value={data.totalSales} icon={ShoppingBag} />
        <Stat label="Active Products" value={data.activeProducts} icon={Package} />
      </div>
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Revenue — last 7 days</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.series}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}