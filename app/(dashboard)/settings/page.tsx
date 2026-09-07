"use client";

import { useEffect, useState } from "react";

type Settings = {
  theme: "Light" | "Dark" | "System";
  showCompleted: boolean;
  defaultPriority: "Low" | "Medium" | "High";
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    theme: "Light",
    showCompleted: true,
    defaultPriority: "Medium",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings");

        if (!response.ok) {
          throw new Error("Failed to load settings");
        }

        const data = await response.json();

        setSettings({
          theme: data.theme ?? "Light",
          showCompleted: data.showCompleted ?? true,
          defaultPriority: data.defaultPriority ?? "Medium",
        });
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      setSettings({
        theme: data.theme ?? settings.theme,
        showCompleted: data.showCompleted ?? settings.showCompleted,
        defaultPriority:
          data.defaultPriority ?? settings.defaultPriority,
      });

      alert("Settings saved successfully.");
    } catch (error) {
      console.error("Failed to save settings:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save settings."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-full bg-slate-50/60 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
              <p className="text-sm font-medium text-slate-500">
                Loading settings...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full bg-slate-50/60 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                Preferences
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Settings
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
                Customize how your task management workspace looks and behaves.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Current Theme
              </p>

              <p className="mt-1 text-sm font-bold text-blue-600">
                {settings.theme}
              </p>
            </div>
          </div>
        </div>

        {/* Main Settings Card */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Section Header */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-white to-blue-50/50 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-lg text-white shadow-sm">
                ⚙
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  Application Preferences
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  Configure your preferred workspace settings.
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">

            {/* Appearance */}
            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    ◐
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Appearance
                    </h3>

                    <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400 sm:text-sm">
                      Choose your preferred application theme.
                    </p>
                  </div>
                </div>

                <div className="w-full sm:max-w-xs">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Theme
                  </label>

                  <select
                    value={settings.theme}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        theme: e.target.value as
                          | "Light"
                          | "Dark"
                          | "System",
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="Light">Light</option>
                    <option value="Dark">Dark</option>
                    <option value="System">System</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Task Display */}
            <div className="p-5 sm:p-6">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  ✓
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-800">
                    Task Display
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
                    Control whether completed tasks are displayed in your
                    workspace.
                  </p>

                  <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        Show completed tasks
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Keep completed tasks visible in task lists.
                      </p>
                    </div>

                    <div className="relative shrink-0">
                      <input
                        type="checkbox"
                        checked={settings.showCompleted}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            showCompleted: e.target.checked,
                          })
                        }
                        className="peer sr-only"
                      />

                      <div className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500 peer-focus:ring-4 peer-focus:ring-emerald-100" />

                      <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Default Priority */}
            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    ★
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Default Priority
                    </h3>

                    <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400 sm:text-sm">
                      Choose the default priority assigned to new tasks.
                    </p>
                  </div>
                </div>

                <div className="w-full sm:max-w-xs">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Priority
                  </label>

                  <select
                    value={settings.defaultPriority}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultPriority: e.target.value as
                          | "Low"
                          | "Medium"
                          | "High",
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Save your preferences
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Changes are applied after saving.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}