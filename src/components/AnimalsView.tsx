import React, { useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { Animal, AnimalInput } from '../types/farm';
import {
  ANIMAL_GENDER_LIST,
  ANIMAL_SPECIES_LIST,
  formatBDT,
  formatNumber,
  HEALTH_CONDITION_LIST,
} from '../utils/farmLogic';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

const EMPTY_FORM: AnimalInput = {
  name: '',
  tagNumber: '',
  species: 'গরু',
  breed: '',
  gender: 'স্ত্রী (গাভী/ছাগী)',
  ageMonths: 12,
  weightKg: 100,
  purchasePrice: 50000,
  healthCondition: 'সুস্থ',
  notes: '',
};

export const AnimalsView: React.FC = () => {
  const { animals, profile, addAnimal, updateAnimal, deleteAnimal } = useFarm();
  const currency = profile.currency || '৳';

  const [searchQuery, setSearchQuery] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<string>('সকল');
  const [healthFilter, setHealthFilter] = useState<string>('সকল');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [form, setForm] = useState<AnimalInput>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deletingTarget, setDeletingTarget] = useState<Animal | null>(null);

  const filteredAnimals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return animals.filter((a) => {
      if (speciesFilter !== 'সকল' && a.species !== speciesFilter) return false;
      if (healthFilter !== 'সকল' && a.healthCondition !== healthFilter) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.tagNumber.toLowerCase().includes(q) ||
        a.breed.toLowerCase().includes(q) ||
        a.notes.toLowerCase().includes(q)
      );
    });
  }, [animals, searchQuery, speciesFilter, healthFilter]);

  const openAddModal = () => {
    setEditingAnimal(null);
    const nextNum = animals.length + 101;
    setForm({
      ...EMPTY_FORM,
      tagNumber: `ANM-${nextNum}`,
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (animal: Animal) => {
    setEditingAnimal(animal);
    setForm({
      name: animal.name,
      tagNumber: animal.tagNumber,
      species: animal.species,
      breed: animal.breed,
      gender: animal.gender,
      ageMonths: animal.ageMonths,
      weightKg: animal.weightKg,
      purchasePrice: animal.purchasePrice,
      healthCondition: animal.healthCondition,
      notes: animal.notes,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const res = editingAnimal
        ? await updateAnimal(editingAnimal.id, form)
        : await addAnimal(form);
      if (!res.ok) {
        setFormError(res.error || 'তথ্য সংরক্ষণ করা যায়নি।');
      } else {
        setModalOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar: Search, Filters & Primary Add Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#789083] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="পশুর নাম বা ট্যাগ খুঁজুন"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="পশুর নাম, ট্যাগ নম্বর বা জাত দিয়ে খুঁজুন..."
              className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-[#101814] border border-[#1E2E26] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
            />
          </div>

          <select
            aria-label="স্বাস্থ্য অবস্থা ফিল্টার"
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value)}
            className="min-h-[44px] px-3.5 py-2 bg-[#101814] border border-[#1E2E26] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#D6E5DC]"
          >
            <option value="সকল">সকল স্বাস্থ্য অবস্থা</option>
            {HEALTH_CONDITION_LIST.map((hc) => (
              <option key={hc} value={hc}>
                {hc}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>নতুন পশু যোগ করুন</span>
        </button>
      </div>

      {/* Interactive Species Segmented Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {['সকল', ...ANIMAL_SPECIES_LIST].map((sp) => (
          <button
            key={sp}
            type="button"
            onClick={() => setSpeciesFilter(sp)}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              speciesFilter === sp
                ? 'bg-emerald-600 text-white'
                : 'bg-[#101814] text-[#9CB0A4] hover:text-[#EFF5F1] border border-[#1C2B22]'
            }`}
          >
            {sp}
          </button>
        ))}
      </div>

      {/* Herd Data Table / Responsive List */}
      <section className="bg-[#101814] border border-[#1C2B22] rounded-2xl overflow-hidden">
        {filteredAnimals.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-base font-medium text-[#DFECE4]">কোনো পশুর তথ্য পাওয়া যায়নি</p>
            <p className="text-xs text-[#899E92]">
              নতুন পশু যুক্ত করতে উপরের "নতুন পশু যোগ করুন" বাটনে ক্লিক করুন।
            </p>
          </div>
        ) : (
          <>
            {/* Desktop High-Density Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1C2B22] text-xs font-semibold text-[#8EA497] bg-[#0D1410]">
                    <th className="py-3.5 px-5">পশুর নাম ও ট্যাগ</th>
                    <th className="py-3.5 px-4">প্রজাতি ও জাত</th>
                    <th className="py-3.5 px-4 text-right">বয়স (মাস)</th>
                    <th className="py-3.5 px-4 text-right">ওজন (কেজি)</th>
                    <th className="py-3.5 px-4 text-right">ক্রয়মূল্য / মূল্যমান</th>
                    <th className="py-3.5 px-4">স্বাস্থ্য অবস্থা</th>
                    <th className="py-3.5 px-5 text-right">পরিবর্তন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#18261E] text-sm">
                  {filteredAnimals.map((animal) => (
                    <tr key={animal.id} className="hover:bg-[#14201A] transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-[#EFF5F1]">{animal.name}</div>
                        <div className="text-xs text-[#899E92]">
                          <span className="font-mono tabular-nums">{animal.tagNumber}</span>
                          {' · '}
                          <span>{animal.gender}</span>
                          {animal.notes ? ` · ${animal.notes}` : ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#C8D8CE]">
                        <div>{animal.species}</div>
                        {animal.breed && (
                          <div className="text-xs text-[#899E92]">{animal.breed}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#D6E5DC]">
                        {formatNumber(animal.ageMonths)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#EFF5F1] font-medium">
                        {formatNumber(animal.weightKg)} কেজি
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#D6E5DC]">
                        {formatBDT(animal.purchasePrice, currency)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          {animal.healthCondition === 'সুস্থ' || animal.healthCondition === 'গর্ভবতী' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="text-emerald-300">{animal.healthCondition}</span>
                            </>
                          ) : (
                            <>
                              <Activity className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="text-amber-300">{animal.healthCondition}</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(animal)}
                            aria-label={`${animal.name} সম্পাদনা করুন`}
                            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[#9CB0A4] hover:text-emerald-300 hover:bg-[#1A2B22] rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTarget(animal)}
                            aria-label={`${animal.name} মুছে ফেলুন`}
                            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[#9CB0A4] hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch Rows */}
            <div className="md:hidden divide-y divide-[#18261E]">
              {filteredAnimals.map((animal) => (
                <div key={animal.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-[#EFF5F1] truncate">{animal.name}</p>
                      <p className="text-xs text-[#899E92]">
                        <span className="font-mono tabular-nums">{animal.tagNumber}</span>
                        {' · '}
                        {animal.species}
                        {animal.breed ? ` (${animal.breed})` : ''}
                        {' · '}
                        {animal.healthCondition}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(animal)}
                        aria-label={`${animal.name} সম্পাদনা করুন`}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#9CB0A4] hover:text-emerald-300 rounded-lg"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTarget(animal)}
                        aria-label={`${animal.name} মুছে ফেলুন`}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#9CB0A4] hover:text-red-400 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#B6C9BE] font-mono tabular-nums">
                    <span>বয়স: {formatNumber(animal.ageMonths)} মাস</span>
                    <span>ওজন: {formatNumber(animal.weightKg)} কেজি</span>
                    <span>মূল্য: {formatBDT(animal.purchasePrice, currency)}</span>
                  </div>
                  {animal.notes && <p className="text-xs text-[#859B8F]">{animal.notes}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Add / Edit Animal Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="animal-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-xl bg-[#101814] border border-[#1E2E26] rounded-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between gap-4 border-b border-[#1A2921] pb-3">
              <h2 id="animal-modal-title" className="text-lg font-bold text-[#EFF5F1]">
                {editingAnimal ? 'পশুর তথ্য সম্পাদনা করুন' : 'নতুন পশু তালিকায় যোগ করুন'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="ফর্ম বন্ধ করুন"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#8CA295] hover:text-[#EFF5F1] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="animal-name" className="block text-xs font-medium text-[#C8D8CE]">
                    পশুর নাম বা ব্যাচ নাম *
                  </label>
                  <input
                    id="animal-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="যেমন: কালা মানিক / লালু"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="animal-tag" className="block text-xs font-medium text-[#C8D8CE]">
                    ট্যাগ / পরিচিতি নম্বর *
                  </label>
                  <input
                    id="animal-tag"
                    type="text"
                    required
                    value={form.tagNumber}
                    onChange={(e) => setForm({ ...form, tagNumber: e.target.value })}
                    placeholder="যেমন: COW-109"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm font-mono text-[#EFF5F1]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="animal-species" className="block text-xs font-medium text-[#C8D8CE]">
                    পশুর ধরন / প্রজাতি *
                  </label>
                  <select
                    id="animal-species"
                    value={form.species}
                    onChange={(e) => setForm({ ...form, species: e.target.value as AnimalInput['species'] })}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                  >
                    {ANIMAL_SPECIES_LIST.map((sp) => (
                      <option key={sp} value={sp}>
                        {sp}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="animal-breed" className="block text-xs font-medium text-[#C8D8CE]">
                    জাত (ঐচ্ছিক)
                  </label>
                  <input
                    id="animal-breed"
                    type="text"
                    value={form.breed}
                    onChange={(e) => setForm({ ...form, breed: e.target.value })}
                    placeholder="যেমন: শাহীওয়াল / ব্ল্যাক বেঙ্গল"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="animal-gender" className="block text-xs font-medium text-[#C8D8CE]">
                    লিঙ্গ / শ্রেণি *
                  </label>
                  <select
                    id="animal-gender"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value as AnimalInput['gender'] })}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                  >
                    {ANIMAL_GENDER_LIST.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="animal-health" className="block text-xs font-medium text-[#C8D8CE]">
                    স্বাস্থ্য অবস্থা *
                  </label>
                  <select
                    id="animal-health"
                    value={form.healthCondition}
                    onChange={(e) =>
                      setForm({ ...form, healthCondition: e.target.value as AnimalInput['healthCondition'] })
                    }
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                  >
                    {HEALTH_CONDITION_LIST.map((hc) => (
                      <option key={hc} value={hc}>
                        {hc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="animal-age" className="block text-xs font-medium text-[#C8D8CE]">
                    বয়স (মাস) *
                  </label>
                  <input
                    id="animal-age"
                    type="number"
                    min="0"
                    max="600"
                    step="1"
                    value={form.ageMonths}
                    onChange={(e) => setForm({ ...form, ageMonths: Number(e.target.value) })}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm font-mono tabular-nums text-[#EFF5F1]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="animal-weight" className="block text-xs font-medium text-[#C8D8CE]">
                    আনুমানিক ওজন (কেজি) *
                  </label>
                  <input
                    id="animal-weight"
                    type="number"
                    min="0"
                    max="5000"
                    step="any"
                    value={form.weightKg}
                    onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) })}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm font-mono tabular-nums text-[#EFF5F1]"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="animal-price" className="block text-xs font-medium text-[#C8D8CE]">
                    ক্রয়মূল্য বা আনুমানিক বাজারমূল্য ({currency})
                  </label>
                  <input
                    id="animal-price"
                    type="number"
                    min="0"
                    max="100000000"
                    step="1"
                    value={form.purchasePrice}
                    onChange={(e) => setForm({ ...form, purchasePrice: Number(e.target.value) })}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm font-mono tabular-nums text-[#EFF5F1]"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="animal-notes" className="block text-xs font-medium text-[#C8D8CE]">
                    নোট / টিকা ও পরিচর্যার তথ্য
                  </label>
                  <textarea
                    id="animal-notes"
                    rows={2}
                    maxLength={500}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="টিকার তারিখ বা বিশেষ খাবার সংক্রান্ত নোট..."
                    className="w-full px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                  />
                </div>
              </div>

              {formError && (
                <p role="alert" className="text-xs text-red-400">
                  {formError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-[44px] px-4 py-2 text-sm font-medium text-[#C8D8CE] bg-[#16221C] hover:bg-[#1E2E26] border border-[#24382E] rounded-xl transition-colors whitespace-nowrap"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[44px] px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors whitespace-nowrap disabled:opacity-60"
                >
                  {saving ? 'সংরক্ষণ হচ্ছে...' : editingAnimal ? 'আপডেট সংরক্ষণ করুন' : 'তালিকায় যোগ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(deletingTarget)}
        title="পশুর তথ্য মুছে ফেলুন"
        itemLabel={deletingTarget ? `${deletingTarget.name} (${deletingTarget.tagNumber})` : ''}
        onCancel={() => setDeletingTarget(null)}
        onConfirm={async () => {
          if (deletingTarget) {
            await deleteAnimal(deletingTarget.id);
          }
        }}
      />
    </div>
  );
};
