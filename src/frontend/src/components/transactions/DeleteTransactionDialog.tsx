import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { TransaksiSelesai } from '../../backend';

interface DeleteTransactionDialogProps {
  transaction: TransaksiSelesai;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
}

export function DeleteTransactionDialog({
  transaction,
  onConfirm,
  isDeleting = false,
}: DeleteTransactionDialogProps) {
  const [open, setOpen] = useState(false);

  const formatCurrency = (amount: bigint | number) => {
    const numAmount = typeof amount === 'bigint' ? Number(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  const formatDateTime = (nanoTimestamp: bigint) => {
    const milliseconds = Number(nanoTimestamp / BigInt(1_000_000));
    return format(new Date(milliseconds), 'dd MMM yyyy, HH:mm', { locale: id });
  };

  const handleConfirm = async () => {
    await onConfirm();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive print:hidden"
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Are you sure you want to delete this transaction? This action cannot be undone.</p>
            <div className="mt-4 rounded-md border bg-muted/50 p-3 text-sm">
              <div className="font-medium text-foreground">Transaction Details:</div>
              <div className="mt-2 space-y-1 text-muted-foreground">
                <div>Date: {formatDateTime(transaction.tanggalTransaksi)}</div>
                <div>Total: {formatCurrency(transaction.total)}</div>
                <div>Items: {transaction.items.length} product(s)</div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
