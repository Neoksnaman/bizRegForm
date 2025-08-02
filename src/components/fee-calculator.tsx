
"use client";

import { useEffect, useState, useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { NumericInput } from "./numeric-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";
import type { BizRegFormValues } from "@/lib/schemas";
import { Calculator } from "lucide-react";

type FeeCalculatorProps = {
  form: UseFormReturn<BizRegFormValues>;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
};

export function FeeCalculator({ form }: FeeCalculatorProps) {
  const [fees, setFees] = useState({
    sec: {
      filingFee: 0,
      byLaws: 1000,
      lrf: 0,
      stbReg: 150,
      nameVerification: 100,
      dst: 30,
      total: 1280,
    },
    bir: {
      dstOnSubscribed: 0,
      dstOnLease: 0,
      total: 0,
    },
    grandTotal: 1280,
  });

  const authorizedCapital = form.watch("sharesDetails.authorizedCapital");
  const subscribedCapital = form.watch("sharesDetails.subscribedCapital");
  const leaseRent = form.watch("leaseRent");
  const parValue = form.watch("sharesDetails.parValue");


  useEffect(() => {
    // SEC Fees
    const filingFee = (authorizedCapital || 0) * 0.002;
    const lrf = (authorizedCapital || 0) * 0.00003;
    
    const secTotal =
      filingFee +
      1000 + // byLaws
      lrf +
      150 + // stbReg
      100 + // nameVerification
      30;  // dst

    // BIR Fees
    const dstOnSubscribed = (subscribedCapital || 0) * (parValue || 0) * 0.01;

    let dstOnLease = 0;
    if (leaseRent && leaseRent > 0) {
        const leaseRentNum = leaseRent || 0;
        // P6.00 for the first P2,000
        // P2.00 for every P1,000 or fractional part thereof in excess of the first P2,000
        if (leaseRentNum <= 2000) {
          dstOnLease = 6;
        } else {
          dstOnLease = 6 + Math.ceil((leaseRentNum - 2000) / 1000) * 2;
        }
    }
    const birTotal = dstOnSubscribed + dstOnLease;

    const grandTotal = secTotal + birTotal;

    setFees({
      sec: {
        filingFee,
        byLaws: 1000,
        lrf,
        stbReg: 150,
        nameVerification: 100,
        dst: 30,
        total: secTotal,
      },
      bir: {
        dstOnSubscribed,
        dstOnLease,
        total: birTotal,
      },
      grandTotal,
    });
  }, [authorizedCapital, subscribedCapital, leaseRent, parValue]);
  
  const chartData = useMemo(() => [
      { name: "SEC Fees", value: fees.sec.total, fill: "hsl(var(--primary))" },
      { name: "BIR Fees", value: fees.bir.total, fill: "hsl(var(--accent))" },
  ], [fees]);


  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <div className="flex items-center gap-2 text-primary">
            <Calculator className="w-5 h-5" />
            <span className="font-semibold text-lg">View Estimated Incorporation Fees</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <Card>
            <CardHeader>
              <CardTitle>Incorporation Fee Estimates</CardTitle>
              <CardDescription>
                These are estimated fees based on the data you provided. Actual
                fees may vary.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="leaseRent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Rent over Lease Term (for DST calculation)</FormLabel>
                        <FormControl>
                          <NumericInput
                            placeholder="0.00"
                            value={field.value ?? 0}
                            onChange={field.onChange}
                            prefix="₱"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <div className="h-[200px]">
                     <ResponsiveContainer width="100%" height="100%">
                      <ChartContainer config={{}} className="w-full h-full">
                        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" hide/>
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
                          />
                          <Bar dataKey="value" radius={5} />
                        </BarChart>
                      </ChartContainer>
                     </ResponsiveContainer>
                   </div>
                </div>

                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="font-semibold bg-primary/10">
                        <TableCell>SEC Fees</TableCell>
                        <TableCell className="text-right">{formatCurrency(fees.sec.total)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Filing Fee</TableCell>
                        <TableCell className="text-right">{formatCurrency(fees.sec.filingFee)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">By-Laws</TableCell>
                        <TableCell className="text-right">{formatCurrency(fees.sec.byLaws)}</TableCell>
                      </TableRow>
                       <TableRow>
                        <TableCell className="pl-6">Legal Research Fee (LRF)</TableCell>
                        <TableCell className="text-right">{formatCurrency(fees.sec.lrf)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Stock and Transfer Book (STB)</TableCell>
                        <TableCell className="text-right">{formatCurrency(fees.sec.stbReg)}</TableCell>
                      </TableRow>
                       <TableRow>
                        <TableCell className="pl-6">Name Verification</TableCell>
                        <TableCell className="text-right">{formatCurrency(fees.sec.nameVerification)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Documentary Stamp Tax (DST)</TableCell>
                        <TableCell className="text-right">{formatCurrency(fees.sec.dst)}</TableCell>
                      </TableRow>
                      <TableRow className="font-semibold bg-accent/10">
                        <TableCell>BIR Fees</TableCell>
                        <TableCell className="text-right">{formatCurrency(fees.bir.total)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">DST on Subscribed Shares</TableCell>
                        <TableCell className="text-right">{formatCurrency(fees.bir.dstOnSubscribed)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">DST on Lease</TableCell>
                        <TableCell className="text-right">{formatCurrency(fees.bir.dstOnLease)}</TableCell>
                      </TableRow>
                       <TableRow className="font-bold text-lg">
                        <TableCell>Grand Total</TableCell>
                        <TableCell className="text-right">{formatCurrency(fees.grandTotal)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
