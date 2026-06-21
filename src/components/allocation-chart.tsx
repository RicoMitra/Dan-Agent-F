"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/format";

type AllocationItem = {
  name: string;
  value: number;
  color: string;
};

export function AllocationChart({ data }: { data: AllocationItem[] }) {
  const usableData = data.filter((item) => item.value > 0);

  if (usableData.length === 0) {
    return (
      <div className="flex h-[230px] items-center justify-center rounded-2xl bg-[#faf8f3] text-sm text-[#88847c]">
        Add assets to see allocation
      </div>
    );
  }

  return (
    <div className="h-[230px] w-full" aria-label="Portfolio allocation chart">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 320, height: 230 }}
      >
        <PieChart>
          <Pie
            data={usableData}
            dataKey="value"
            nameKey="name"
            innerRadius={64}
            outerRadius={94}
            paddingAngle={3}
            stroke="none"
          >
            {usableData.map((item) => (
              <Cell key={item.name} fill={item.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e5e1d8",
              boxShadow: "0 10px 30px rgba(38,35,29,.08)",
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
