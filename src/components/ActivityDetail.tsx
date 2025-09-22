import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { getActivityById } from '../utils/Activities';

type Props = {
  txId: string;
  onBack: () => void;
};

const money = (n: number) => `₭ ${n.toLocaleString()}`;

const ActivityDetail: React.FC<Props> = ({ txId, onBack }) => {
  const tx = getActivityById(txId);

  if (!tx) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 border rounded-lg hover:bg-gray-50">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">ບໍ່ພົບການເຮັດກິດຈະກຳ</h1>
        </div>
        <div className="text-gray-600">ລາຍການທີ່ທ່ານເລືອກອາດຈະຖືກລົບ ຫຼື ID ບໍ່ຖືກຕ້ອງ</div>
      </div>
    );
  }

  const color =
    tx.type === 'income' ? 'text-green-600'
    : tx.type === 'expense' ? 'text-red-600'
    : 'text-indigo-600';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 border rounded-lg hover:bg-gray-50">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">ລາຍລະອຽດລາຍການ</h1>
          <p className="text-gray-600">ID: {tx.id}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <Row label="ວັນທີ" value={tx.date} />
        <Row label="ຜູ້ບັນທຶກ" value={tx.userName} />
        <Row label="ປະເພດ" value={tx.type} valueClass={color} />
        <Row label="ຈຳນວນເງິນ" value={money(tx.amount)} valueClass={color} />
        <Row label="ຫມວດຫມູ່" value={tx.category} />
        <Row label="ວິທີຊຳລະ" value={tx.paymentMethod || '-'} />
        <Row label="ຕະຫຼາດ" value={tx.marketName || '-'} />
        <Row label="ຜູ້ກ່ຽວຂ້ອງ" value={tx.partyInvolved || '-'} />
        <div>
          <div className="text-sm text-gray-600 mb-1">ບັນທຶກ/ເຫດຜົນ</div>
          <div className="border rounded-lg p-3 min-h-[56px]">{tx.note || '-'}</div>
        </div>
        {tx.slipUrl && (
          <div>
            <div className="text-sm text-gray-600 mb-1">ຫຼັກຖານ</div>
            <img src={tx.slipUrl} alt="slip" className="max-h-96 rounded-lg border" />
          </div>
        )}
      </div>
    </div>
  );
};

const Row = ({
  label, value, valueClass,
}: { label: string; value: React.ReactNode; valueClass?: string }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
    <div className="text-sm text-gray-600 md:col-span-1">{label}</div>
    <div className={`font-medium md:col-span-3 ${valueClass || ''}`}>{value}</div>
  </div>
);

export default ActivityDetail;
