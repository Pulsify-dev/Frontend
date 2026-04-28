import { Link, useLocation } from "react-router-dom";

const TABS = [
  { label: "Following", path: "/following" },
  { label: "Followers", path: "/followers" },
];

export default function SocialHeader({ counts, filterValue, onFilterChange }) {
  const location = useLocation();

  function getTabLabel(tab) {
    if (tab.label === "Following" && counts?.followingCount != null) {
      return `Following ${counts.followingCount}`;
    }
    if (tab.label === "Followers" && counts?.followersCount != null) {
      return `Followers ${counts.followersCount}`;
    }
    return tab.label;
  }

  return (
    <div className="sc-social-header">
      <div className="sc-social-header__top">
        <div className="sc-social-tabs">
          {TABS.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className={`sc-social-tab ${location.pathname === tab.path ? "sc-social-tab--active" : ""}`}
            >
              {getTabLabel(tab)}
            </Link>
          ))}
        </div>

        {onFilterChange && (
          <div className="sc-social-filter">
            <input
              type="text"
              className="sc-social-filter__input"
              placeholder="Filter"
              value={filterValue || ""}
              onChange={(e) => onFilterChange(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
