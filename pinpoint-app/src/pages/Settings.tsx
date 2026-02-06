import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Card, Button, Input, Badge } from '../components';
import { useAuthStore } from '../stores/authStore';
import { useBusinessConfigStore } from '../stores/businessConfigStore';
import { useThemeStore } from '../stores/themeStore';
import {
  User,
  Building2,
  LogOut,
  Shield,
  ChevronRight,
  Info,
  Phone,
  MapPin,
  Save,
  Check,
  DollarSign,
  Plus,
  Trash2,
  Star,
  Percent,
  Clock,
  Wrench,
} from 'lucide-react';

export const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  /* Profile form */
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone] = useState(user?.phoneNumber || '');
  const [profileSaved, setProfileSaved] = useState(false);

  /* Business config */
  const bizConfig = useBusinessConfigStore();
  const [newRateLabel, setNewRateLabel] = useState('');
  const [newRateValue, setNewRateValue] = useState('');
  const [newCostLabel, setNewCostLabel] = useState('');
  const [newCostValue, setNewCostValue] = useState('');

  /* Company form */
  const [companyName, setCompanyName] = useState(
    () => localStorage.getItem('pp_company_name') || 'Pinpoint Painting'
  );
  const [companyAddress, setCompanyAddress] = useState(
    () => localStorage.getItem('pp_company_address') || ''
  );
  const [companySaved, setCompanySaved] = useState(false);

  const handleSaveProfile = () => {
    // In a real app this would call the API — for now persist locally
    localStorage.setItem('pp_user_name', profileName);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleSaveCompany = () => {
    localStorage.setItem('pp_company_name', companyName);
    localStorage.setItem('pp_company_address', companyAddress);
    setCompanySaved(true);
    setTimeout(() => setCompanySaved(false), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout activeTab="settings">
      <div className="px-5 pt-6 pb-8 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your account and preferences</p>
        </div>

        {/* User Profile */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <User size={20} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Profile</h2>
              <p className="text-xs text-slate-500">Your personal information</p>
            </div>
            <Badge variant={user?.role === 'admin' ? 'info' : 'neutral'} size="sm">
              {user?.role || 'user'}
            </Badge>
          </div>

          <div className="space-y-3">
            <Input
              label="Name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Your name"
              leftIcon={<User size={16} />}
            />
            <Input
              label="Phone"
              value={profilePhone}
              disabled
              leftIcon={<Phone size={16} />}
            />

            <Button
              size="sm"
              icon={profileSaved ? <Check size={16} /> : <Save size={16} />}
              onClick={handleSaveProfile}
              variant={profileSaved ? 'secondary' : 'primary'}
            >
              {profileSaved ? 'Saved!' : 'Save Profile'}
            </Button>
          </div>
        </Card>

        {/* Company Info */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Company</h2>
              <p className="text-xs text-slate-500">Business details for estimates</p>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              label="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your company name"
              leftIcon={<Building2 size={16} />}
            />
            <Input
              label="Address"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              placeholder="123 Main St, City, ST 00000"
              leftIcon={<MapPin size={16} />}
            />

            <Button
              size="sm"
              icon={companySaved ? <Check size={16} /> : <Save size={16} />}
              onClick={handleSaveCompany}
              variant={companySaved ? 'secondary' : 'primary'}
            >
              {companySaved ? 'Saved!' : 'Save Company Info'}
            </Button>
          </div>
        </Card>

        {/* Hourly Rates */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
              <DollarSign size={20} className="text-green-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Hourly Rates</h2>
              <p className="text-xs text-slate-500">Used by voice estimator for labor calculations</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {bizConfig.hourlyRates.map(rate => (
              <div key={rate.id} className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                <button
                  onClick={() => bizConfig.setDefaultRate(rate.id)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    rate.isDefault ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/50 text-slate-600 hover:text-slate-400'
                  }`}
                  title={rate.isDefault ? 'Default rate' : 'Set as default'}
                >
                  <Star size={12} fill={rate.isDefault ? 'currentColor' : 'none'} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{rate.label}</p>
                  {rate.isDefault && <span className="text-[10px] text-green-400">Default</span>}
                </div>
                <span className="text-sm font-bold text-green-400">${rate.rate}/hr</span>
                <button
                  onClick={() => bizConfig.removeRate(rate.id)}
                  className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Add new rate */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Label"
              value={newRateLabel}
              onChange={e => setNewRateLabel(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-green-500/50"
            />
            <input
              type="number"
              placeholder="$/hr"
              value={newRateValue}
              onChange={e => setNewRateValue(e.target.value)}
              className="w-20 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-green-500/50"
            />
            <button
              onClick={() => {
                if (newRateLabel.trim() && newRateValue) {
                  bizConfig.addRate(newRateLabel.trim(), parseFloat(newRateValue));
                  setNewRateLabel('');
                  setNewRateValue('');
                }
              }}
              disabled={!newRateLabel.trim() || !newRateValue}
              className="px-3 py-2 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-30 transition-all"
            >
              <Plus size={18} />
            </button>
          </div>
        </Card>

        {/* One-Off Costs */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Wrench size={20} className="text-amber-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">One-Off Costs</h2>
              <p className="text-xs text-slate-500">Add-on services with flat pricing</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {bizConfig.oneOffCosts.map(cost => (
              <div key={cost.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{cost.label}</p>
                </div>
                <span className="text-sm font-bold text-amber-400">${cost.cost}</span>
                <button
                  onClick={() => bizConfig.removeCost(cost.id)}
                  className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Add new cost */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Service name"
              value={newCostLabel}
              onChange={e => setNewCostLabel(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
            />
            <input
              type="number"
              placeholder="$"
              value={newCostValue}
              onChange={e => setNewCostValue(e.target.value)}
              className="w-20 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
            />
            <button
              onClick={() => {
                if (newCostLabel.trim() && newCostValue) {
                  bizConfig.addCost(newCostLabel.trim(), parseFloat(newCostValue));
                  setNewCostLabel('');
                  setNewCostValue('');
                }
              }}
              disabled={!newCostLabel.trim() || !newCostValue}
              className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 disabled:opacity-30 transition-all"
            >
              <Plus size={18} />
            </button>
          </div>
        </Card>

        {/* Estimate Defaults */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Percent size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Estimate Defaults</h2>
              <p className="text-xs text-slate-500">Markup, tax, and work day settings</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-400 w-32">Material Markup</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={bizConfig.defaultMarkupPercent}
                  onChange={e => bizConfig.setMarkup(parseFloat(e.target.value) || 0)}
                  className="w-20 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/50 text-white text-sm focus:outline-none focus:border-purple-500/50"
                />
                <span className="text-sm text-slate-500">%</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-400 w-32">Tax Rate</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={bizConfig.defaultTaxRate}
                  onChange={e => bizConfig.setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-20 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/50 text-white text-sm focus:outline-none focus:border-purple-500/50"
                />
                <span className="text-sm text-slate-500">%</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-400 w-32 flex items-center gap-1"><Clock size={14} /> Hours/Day</label>
              <input
                type="number"
                value={bizConfig.defaultHoursPerDay}
                onChange={e => bizConfig.setHoursPerDay(parseFloat(e.target.value) || 8)}
                className="w-20 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/50 text-white text-sm focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>
        </Card>

        {/* Admin Panel Link */}
        {user?.role === 'admin' && (
          <Card
            clickable
            onClick={() => navigate('/admin')}
            className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Shield size={20} className="text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">Admin Panel</p>
                <p className="text-xs text-slate-400">Manage users, approvals, and roles</p>
              </div>
              <ChevronRight size={18} className="text-slate-500" />
            </div>
          </Card>
        )}

        {/* Theme Toggle */}
        <Card>
          <div className="flex items-center justify-between" onClick={() => toggleTheme()} style={{ cursor: 'pointer' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-700/50 rounded-xl flex items-center justify-center">
                <span className="text-lg">{theme === 'dark' ? '🌙' : '☀️'}</span>
              </div>
              <div>
                <p className="font-medium text-white text-sm">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
                <p className="text-xs text-slate-500">Tap to switch theme</p>
              </div>
            </div>
            <div className={`w-12 h-7 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-blue-500' : 'bg-slate-300'}`}>
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${theme === 'dark' ? 'right-1' : 'left-1'}`} />
            </div>
          </div>
        </Card>

        {/* Sign Out */}
        <Button variant="danger" fullWidth icon={<LogOut size={18} />} onClick={handleLogout}>
          Sign Out
        </Button>

        {/* Debug & Version Info */}
        <div className="text-center pt-4 space-y-2">
          <button
            onClick={() => navigate('/debug')}
            className="text-xs text-slate-500 hover:text-blue-400 transition-colors underline underline-offset-2"
          >
            View Debug Log
          </button>
          <div className="flex items-center justify-center gap-2 text-slate-600 text-xs">
            <Info size={12} />
            <span>Pinpoint Painting v1.0.0</span>
          </div>
          <p className="text-slate-700 text-[10px] mt-1">Built with ♦ in Cleveland, OH</p>
        </div>
      </div>
    </Layout>
  );
};
