import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cashbackBonusApi } from "../modules/cashbackBonus/api";

export function CashbackBonusHistoryPage({ canRetry }: { canRetry: boolean }) {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ status: "", offerCode: "", betSlipId: "", walletType: "", page: 1, limit: 25 });
  const q = useQuery({
    queryKey: ["cashback-bonus", "history", filters],
    queryFn: () => cashbackBonusApi.listTransactions(filters as any),
  });

  const [selected, setSelected] = useState<any | null>(null);
  const detail = useQuery({
    queryKey: ["cashback-bonus", "tx", selected?.id],
    queryFn: () => cashbackBonusApi.getTransaction(String(selected.id)),
    enabled: Boolean(selected?.id),
  });

  const retry = useMutation({
    mutationFn: (id: string) => cashbackBonusApi.retryTransaction(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["cashback-bonus", "history"] });
      if (selected?.id) await qc.invalidateQueries({ queryKey: ["cashback-bonus", "tx", selected.id] });
    },
  });

  const rows = useMemo(() => (q.data?.transactions ? q.data.transactions : []), [q.data]);

  return (
    <div className="space-y-8 text-white animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold font-display tracking-tight text-white uppercase italic">
          Cashback <span className="text-brand">History</span>
        </h1>
        <p className="text-zinc-400 mt-1">Filter and review cashback audit records.</p>
      </header>

      <Card className="bg-[#1A1A1A] border-zinc-800/50">
        <CardHeader>
          <CardTitle className="text-white">Filters</CardTitle>
          <CardDescription className="text-zinc-400">Use filters to find transactions quickly.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Status</div>
            <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v, page: 1 }))}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent className="bg-[#111] border-zinc-800 text-white">
                <SelectItem value="">Any</SelectItem>
                <SelectItem value="CREDITED">CREDITED</SelectItem>
                <SelectItem value="REJECTED">REJECTED</SelectItem>
                <SelectItem value="FAILED">FAILED</SelectItem>
                <SelectItem value="PENDING">PENDING</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Offer</div>
            <Select value={filters.offerCode} onValueChange={(v) => setFilters((f) => ({ ...f, offerCode: v, page: 1 }))}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent className="bg-[#111] border-zinc-800 text-white">
                <SelectItem value="">Any</SelectItem>
                <SelectItem value="ONE_LOSS">ONE_LOSS</SelectItem>
                <SelectItem value="TWO_LOSSES">TWO_LOSSES</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Slip ID</div>
            <Input value={filters.betSlipId} onChange={(e) => setFilters((f) => ({ ...f, betSlipId: e.target.value.trim(), page: 1 }))} className="bg-zinc-900 border-zinc-800 text-white" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Wallet</div>
            <Select value={filters.walletType} onValueChange={(v) => setFilters((f) => ({ ...f, walletType: v, page: 1 }))}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent className="bg-[#111] border-zinc-800 text-white">
                <SelectItem value="">Any</SelectItem>
                <SelectItem value="BONUS">BONUS</SelectItem>
                <SelectItem value="MAIN">MAIN</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1A1A1A] border-zinc-800/50">
        <CardHeader>
          <CardTitle className="text-white">Transactions</CardTitle>
          <CardDescription className="text-zinc-400">Click a row to view details.</CardDescription>
        </CardHeader>
        <CardContent>
          {q.isLoading ? <div className="text-zinc-500">Loading...</div> : null}
          {q.isError ? <div className="text-zinc-500">Failed to load history.</div> : null}
          {q.isSuccess ? (
            rows.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Slip ID</TableHead>
                    <TableHead>Offer</TableHead>
                    <TableHead className="text-right">Stake</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r: any) => (
                    <TableRow key={r.id} onClick={() => setSelected(r)} className="cursor-pointer">
                      <TableCell className="text-zinc-300">{new Date(r.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-xs text-zinc-300">{r.betSlipId}</TableCell>
                      <TableCell className="text-zinc-300">{r.offerCode || "-"}</TableCell>
                      <TableCell className="text-right text-zinc-300">{r.stake}</TableCell>
                      <TableCell className="text-right text-zinc-300">{r.creditedAmount}</TableCell>
                      <TableCell className="text-zinc-300">{r.status}</TableCell>
                      <TableCell className="text-right">
                        {r.status === "FAILED" ? (
                          <Button
                            disabled={!canRetry || retry.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Retry this failed cashback transaction?")) retry.mutate(String(r.id));
                            }}
                            className="bg-brand text-black hover:bg-brand/90 rounded-xl font-bold"
                          >
                            Retry
                          </Button>
                        ) : (
                          <span className="text-zinc-600 text-xs">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-zinc-500">No transactions found.</div>
            )
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(v) => (!v ? setSelected(null) : null)}>
        <DialogContent className="bg-[#111] border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cashback Transaction</DialogTitle>
          </DialogHeader>
          {detail.isLoading ? <div className="text-zinc-500">Loading...</div> : null}
          {detail.isError ? <div className="text-zinc-500">Failed to load details.</div> : null}
          {detail.isSuccess ? (
            <div className="space-y-2 text-sm text-zinc-300">
              <div><span className="text-zinc-500">ID:</span> <span className="font-mono text-xs">{detail.data.transaction.id}</span></div>
              <div><span className="text-zinc-500">Slip:</span> <span className="font-mono text-xs">{detail.data.transaction.betSlipId}</span></div>
              <div><span className="text-zinc-500">Status:</span> {detail.data.transaction.status}</div>
              <div><span className="text-zinc-500">Offer:</span> {detail.data.transaction.offerCode || "-"}</div>
              <div><span className="text-zinc-500">Rejection/Failure:</span> {detail.data.transaction.rejectionReason || detail.data.transaction.rejection_reason || "-"}</div>
              <div><span className="text-zinc-500">Amount:</span> {detail.data.transaction.creditedAmount}</div>
              {detail.data.transaction.WalletTransaction ? (
                <div><span className="text-zinc-500">Wallet Ref:</span> {detail.data.transaction.WalletTransaction.ref}</div>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            {selected?.status === "FAILED" && canRetry ? (
              <Button onClick={() => retry.mutate(String(selected.id))} className="bg-brand text-black hover:bg-brand/90 rounded-xl font-bold">Retry</Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

