import React, { useEffect, useMemo, useState } from 'react';
import { Plus, MapPin, Users, Pencil } from 'lucide-react';
import { useMarkets } from '../contexts/MarketContext';
import { useTransactions } from '../contexts/TransactionContext'; // (ยังคง import ไว้ ถ้าส่วนอื่นใช้)
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../contexts/NotificationContext';
import {
  listProvinces,
  listDistricts,
  listVillages,
  fetchMarketCustomers,
  fetchAddressName,
  fetchMarketSummary,       // ✅ ใช้ preload summary 30 วัน/ตลาด
} from './Service/marketService';

type MarketsProps = {
  onOpenDetail: (marketId: string) => void;
};

// ย่อชื่อให้เหลือ 3 ตัวอักษร + "..."
const short3 = (s?: string) => (!s ? '' : s.length > 3 ? `${s.slice(0, 3)}...` : s);

// แสดงจำนวนเงินแบบสั้น (270k, 12M)
const compactLAK = (n?: number) => {
  const v = Number(n || 0);
  const av = Math.abs(v);
  if (av >= 1_000_000) return `${Math.round(v / 1_000_000)}M`;
  if (av >= 1_000) return `${Math.round(v / 1_000)}k`;
  return `${v}`;
};

const Markets: React.FC<MarketsProps> = ({ onOpenDetail }) => {
  const { showSuccess, showError, showConfirm } = useNotifications();
  const { t } = useTranslation();

  const { markets, addMarket, listMembers, getAgents, removeMarket, editMarket } = useMarkets();
  const { transactions } = useTransactions(); // ไม่ใช้ในยอดรวมแล้ว แต่คงไว้เพื่อไม่กระทบส่วนอื่น

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; villageId: number } | null>(null);

  // ✅ preload agent + member count ต่อ “ตลาด”
  const [membersInfoByMarket, setMembersInfoByMarket] = useState<
    Record<string, { agentNames: string; memberCount: number }>
  >({});

  // ✅ preload ชื่อบ้าน/เมือง/แขวง ต่อ “ตลาด”
  const [addressByMarket, setAddressByMarket] = useState<
    Record<string, { village?: string; city?: string; district?: string }>
  >({});

  // ✅ preload summary 30 วัน ต่อ “ตลาด” (เหมือน MarketDetail)
  const [summaryByMarket, setSummaryByMarket] = useState<
    Record<string, { income: number; expense: number }>
  >({});

  // ✅ โหลดรายลูกค้าเพื่อให้ agent/member แสดงทันที
  useEffect(() => {
    let cancelled = false;
    const token =
      sessionStorage.getItem('authToken') ||
      localStorage.getItem('authToken') ||
      '';

    (async () => {
      try {
        const entries = await Promise.all(
          markets.map(async (m) => {
            try {
              const res = await fetchMarketCustomers(Number(m.id), 1, 500, '');
              const raw = Array.isArray(res?.data) ? res.data : res?.data ?? res;
              const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
              const agents = arr.filter((c: any) => Number(c.role_id) === 3);
              const agentNames =
                agents.length === 0
                  ? '—'
                  : agents.map((a: any) => `${a.Fname ?? a.firstName ?? ''} ${a.Lname ?? a.lastName ?? ''}`.trim()).join(', ');
              const memberCount = arr.length;
              return [m.id, { agentNames, memberCount }] as const;
            } catch {
              return [m.id, { agentNames: '—', memberCount: 0 }] as const;
            }
          })
        );
        if (!cancelled) setMembersInfoByMarket(Object.fromEntries(entries));
      } catch (e) {
        console.error('preload customers failed', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [markets]);

  // ✅ โหลดชื่อบ้าน/เมือง/แขวง ตั้งแต่เปิดหน้า (สำหรับคอลัมน์ “ที่ตั้ง”)
  useEffect(() => {
    let cancelled = false;
    const token =
      sessionStorage.getItem('authToken') ||
      localStorage.getItem('authToken') ||
      '';

    (async () => {
      try {
        const entries = await Promise.all(
          markets.map(async (m) => {
            try {
              // ดึง village_id จากหลายฟิลด์ที่อาจมีใน model
              const vid =
                Number(
                  (m as any).addressId ??
                    (m as any).Address ??
                    (m as any).villageId ??
                    (m as any).village
                ) || 0;
              if (!vid) return [m.id, { village: m.village, city: m.city, district: m.district }] as const;

              const res = await fetchAddressName(vid);
              const parts = res?.parts || {};
              return [
                m.id,
                {
                  village: parts.village ?? m.village,
                  city: parts.district ?? m.city,
                  district: parts.province ?? m.district,
                },
              ] as const;
            } catch {
              return [m.id, { village: m.village, city: m.city, district: m.district }] as const;
            }
          })
        );
        if (!cancelled) setAddressByMarket(Object.fromEntries(entries));
      } catch (e) {
        console.error('preload address failed', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [markets]);

  // ✅ โหลดสรุปรายรับ/รายจ่าย 30 วันสำหรับทุกตลาด (ให้ตรงกับหน้า Detail)
  useEffect(() => {
    let cancelled = false;
    const token =
      sessionStorage.getItem('authToken') ||
      localStorage.getItem('authToken') ||
      '';
    (async () => {
      try {
        const entries = await Promise.all(
          markets.map(async (m) => {
            try {
              const sum = await fetchMarketSummary(Number(m.id), 30);
              const income = Number(sum?.totalIncome ?? sum?.income ?? 0);
              const expense = Number(sum?.totalExpense ?? sum?.expense ?? 0);
              return [m.id, { income, expense }] as const;
            } catch (e) {
              console.warn('summary failed for market', m.id, e);
              return [m.id, { income: 0, expense: 0 }] as const;
            }
          })
        );
        if (!cancelled) setSummaryByMarket(Object.fromEntries(entries));
      } catch (e) {
        console.error('preload summary failed', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [markets]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('markets.title')}</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('ເພີ່ມຕະຫຼາດ')}
          </button>
        </div>
      </div>

      {/* Inline Create Form */}
      {showForm && (
        <MarketInlineForm
          onCancel={() => setShowForm(false)}
          onSave={async (payload) => {
            try {
              await addMarket({
                name: payload.name,
                village: String(payload.villageId),
              });
              showSuccess(t('Market added successfully') || 'Market added successfully');
              setShowForm(false);
            } catch (e) {
              console.error(e);
              showError(t('Failed to add market') || 'Failed to add market');
            }
          }}
        />
      )}

      {/* Inline Edit Form */}
      {editing && (
        <MarketInlineForm
          initialName={editing.name}
          initialVillageId={editing.villageId}
          onCancel={() => setEditing(null)}
          onSave={(payload) => {
            showConfirm(
              t('ยืนยันการแก้ไขตะຫຼາດนี้หรือไม่?') || 'Confirm edit market?',
              async (reasonText) => {
                try {
                  await editMarket(
                    editing.id,
                    { name: payload.name, villageId: payload.villageId },
                    reasonText || 'update market'
                  );
                  showSuccess(t('Market updated successfully') || 'Market updated successfully');
                  setEditing(null);
                } catch (e) {
                  console.error(e);
                  showError(t('Failed to update market') || 'Failed to update market');
                }
              },
              { label: t('เหตุผลการแก้ไข') || 'Edit reason', placeholder: t('พิมพ์เหตุผลที่แก้ไข') || 'Why?', isRequired: false }
            );
          }}
        />
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b">
            <tr className="text-sm text-gray-600">
              <th className="p-3">ID</th>
              <th className="p-3">{t('ຊື່')}</th>
              <th className="p-3">{t('ທີ່ຕັ້ງ')}</th>
              <th className="p-3">ແມ່ຄ່າຍ (agent)</th>
              <th className="p-3">{t('ສະມາຊິກ')}</th>
              <th className="p-3">{t('ຍອດລວມ')}</th>
              <th className="p-3">{t('ລາຍລະອຽດ')}</th>
              <th className="p-3">{t('ແກ້ໄຂ') || 'Edit'}</th>
              <th className="p-3">{t('ລຶບ') || 'Delete'}</th>
            </tr>
          </thead>
          <tbody>
            {markets.map((m) => {
              const preload = membersInfoByMarket[m.id];
              const agentLabel =
                preload?.agentNames ??
                (getAgents(m.id).length
                  ? getAgents(m.id).map((a) => `${a.firstName} ${a.lastName}`.trim()).join(', ')
                  : '—');
              const memberCount = preload?.memberCount ?? listMembers(m.id).length;

              // ใช้ชื่อจาก address preload ถ้ามี ไม่มีก็ fallback ของเดิม
              const addr = addressByMarket[m.id] || {};
              const villageName = addr.village ?? m.village;
              const cityName = addr.city ?? m.city;
              const districtName = addr.district ?? m.district;

              const sum = summaryByMarket[m.id] || { income: 0, expense: 0 };

              return (
                <tr key={m.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono text-sm">{m.id}</td>
                  <td className="p-3">{m.name}</td>

                  {/* ที่ตั้ง: ย่อทั้ง บ้าน/เมือง/แขวง */}
                  <td className="p-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{short3(villageName)}, {short3(cityName)}, {short3(districtName)}</span>
                    </div>
                  </td>

                  {/* Agent */}
                  <td className="p-3 text-sm">{agentLabel}</td>

                  {/* Member count */}
                  <td className="p-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{memberCount}</span>
                    </div>
                  </td>

                  {/* ยอดรวม: ดึงจาก API 30 วัน เหมือนหน้า Detail */}
                  <td className="p-3 text-sm">
                    ລາຍຈ່າຍ {compactLAK(sum.expense)} • ລາຍຮັບ {compactLAK(sum.income)}
                  </td>

                  {/* Detail */}
                  <td className="p-3">
                    <button
                      onClick={() => onOpenDetail(m.id)}
                      className="px-3 py-1 rounded-lg border hover:bg-gray-50"
                    >
                      {t('ເບິ່ງລາຍລະອຽດ')}
                    </button>
                  </td>

                  {/* Edit */}
                  <td className="p-3">
                    <button
                      onClick={() =>
                        setEditing({
                          id: m.id,
                          name: m.name,
                          villageId: Number(
                            (m as any).addressId ??
                              (m as any).Address ??
                              (m as any).villageId ??
                              (m as any).village ??
                              0
                          ),
                        })
                      }
                      className="px-3 py-1 rounded-lg border hover:bg-gray-50 inline-flex items-center gap-1"
                    >
                      <Pencil className="h-4 w-4" />
                      {t('ແກ້ໄຂ') || 'Edit'}
                    </button>
                  </td>

                  {/* Delete */}
                  <td className="p-3">
                    <button
                      onClick={() =>
                        showConfirm(
                          t('Are you sure you want to delete this market?') || 'Delete this market?',
                          async () => {
                            try {
                              await removeMarket(m.id);
                              showSuccess(t('Market deleted successfully') || 'Deleted successfully');
                            } catch (e) {
                              console.error(e);
                              showError(t('Failed to delete market') || 'Failed to delete market');
                            }
                          }
                        )
                      }
                      className="px-3 py-1 rounded-lg border border-red-500 text-red-500 hover:bg-red-50"
                    >
                      {t('ລຶບ') || 'Delete'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {markets.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan={9}>
                  {t('ບໍ່ມີຕະຫຼາດທີ່ບັນທຶກ')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Markets;

/* ====== ฟอร์มใช้ได้ทั้ง “เพิ่ม” และ “แก้ไข” โดยส่งค่า initial* ====== */
const MarketInlineForm: React.FC<{
  onCancel: () => void;
  onSave: (payload: { name: string; villageId: number }) => void;
  initialName?: string;
  initialVillageId?: number;
}> = ({ onCancel, onSave, initialName = '', initialVillageId }) => {
  const { t } = useTranslation();
  const { showError } = useNotifications();

  const [provinces, setProvinces] = React.useState<{ id: number; name: string }[]>([]);
  const [districts, setDistricts] = React.useState<{ id: number; name: string }[]>([]);
  const [villages, setVillages] = React.useState<{ id: number; name: string }[]>([]);

  const [name, setName] = React.useState(initialName);
  const [provinceId, setProvinceId] = React.useState<number | ''>('');
  const [districtId, setDistrictId] = React.useState<number | ''>('');
  const [villageId, setVillageId] = React.useState<number | ''>(initialVillageId ?? '');

  const token = sessionStorage.getItem('authToken') || '';

  React.useEffect(() => {
    (async () => {
      try {
        const res = await listProvinces();
        setProvinces(res);
      } catch (e) {
        console.error(e);
        showError('ໂຫຼດລາຍຊື່ແຂວງບໍ່ສຳເລັດ');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (provinceId === '') {
      setDistricts([]);
      setDistrictId('');
      setVillages([]);
      if (!initialVillageId) setVillageId('');
      return;
    }
    (async () => {
      try {
        const res = await listDistricts(Number(provinceId));
        setDistricts(res);
        setDistrictId('');
        setVillages([]);
        if (!initialVillageId) setVillageId('');
      } catch (e) {
        console.error(e);
        showError('ໂຫຼດລາຍຊື່ເມືອງບໍ່ສຳເລັດ');
      }
    })();
  }, [provinceId]);

  React.useEffect(() => {
    if (districtId === '') {
      setVillages([]);
      if (!initialVillageId) setVillageId('');
      return;
    }
    (async () => {
      try {
        const res = await listVillages(Number(districtId));
        setVillages(res);
        if (!initialVillageId) setVillageId('');
      } catch (e) {
        console.error(e);
        showError('โหลดรายชื่อบ้านไม่สำเร็จ');
      }
    })();
  }, [districtId]);

  const canSave = name.trim() !== '' && typeof villageId === 'number';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          className="border rounded-lg p-2"
          placeholder={t('ຊື່ຕະຫຼາດ')}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className="border rounded-lg p-2"
          value={provinceId}
          onChange={(e) => setProvinceId(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">{t('ແຂວງ')}</option>
          {provinces.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          className="border rounded-lg p-2"
          value={districtId}
          onChange={(e) => setDistrictId(e.target.value ? Number(e.target.value) : '')}
          disabled={provinceId === ''}
        >
          <option value="">{t('ເມືອງ')}</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select
          className="border rounded-lg p-2"
          value={villageId}
          onChange={(e) => setVillageId(e.target.value ? Number(e.target.value) : '')}
          disabled={districtId === ''}
        >
          <option value="">{t('ບ້ານ')}</option>
          {villages.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-2 mt-3">
        <button className="px-3 py-2 border rounded-lg" onClick={onCancel}>
          {t('ຍົກເລີກ')}
        </button>
        <button
          className="px-3 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          disabled={!canSave}
          onClick={() => onSave({ name, villageId: Number(villageId) })}
        >
          {t('save')}
        </button>
      </div>
    </div>
  );
};
