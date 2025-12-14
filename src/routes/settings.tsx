import { Outlet, createFileRoute, linkOptions } from "@tanstack/react-router";
import { BellIcon, FingerPrintIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Link } from "@/components/ui-primitives/link";

export const Route = createFileRoute("/settings")({
  component: SettingsComponent,
});

const settingsItems = linkOptions([
  {
    name: "Client API",
    to: "/settings/client-api",
    icon: FingerPrintIcon,
  },
  { name: "UX", to: "/settings/ux", icon: BellIcon },
]);

function SettingsComponent() {
  return (
    <div className="mx-auto max-w-7xl pt-16 lg:flex lg:gap-x-16 lg:px-8">
      <h1 className="sr-only">Settings</h1>

      <aside className="flex overflow-x-auto border-b border-gray-900/5 py-4 lg:block lg:w-64 lg:flex-none lg:border-0 lg:py-20 dark:border-white/10">
        <nav className="flex-none px-4 sm:px-6 lg:px-0">
          <ul
            role="list"
            className="flex gap-x-3 gap-y-1 whitespace-nowrap lg:flex-col"
          >
            {settingsItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  activeProps={{
                    className: clsx(
                      "bg-gray-50 text-indigo-600 dark:bg-white/5 dark:text-white",
                      "group flex gap-x-3 rounded-md py-2 pr-3 pl-2 text-sm/6 font-semibold",
                    ),
                  }}
                  inactiveProps={{
                    className: clsx(
                      "text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white",
                      "group flex gap-x-3 rounded-md py-2 pr-3 pl-2 text-sm/6 font-semibold",
                    ),
                  }}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        aria-hidden="true"
                        className={clsx(
                          isActive
                            ? "text-indigo-600 dark:text-white"
                            : "text-gray-400 group-hover:text-indigo-600 dark:text-gray-500 dark:group-hover:text-white",
                          "size-6 shrink-0",
                        )}
                      />
                      {item.name}
                    </>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main className="px-4 py-16 sm:px-6 lg:flex-auto lg:px-0 lg:py-20">
        <div className="mx-auto max-w-2xl space-y-16 sm:space-y-20 lg:mx-0 lg:max-w-none">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
