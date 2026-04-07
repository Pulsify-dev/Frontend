import { useState } from "react";

const DataTable = ({
  columns,
  data,
  emptyState = {
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    title: "No data found",
    text: "There are no items to display at this time.",
  },
  onPageChange,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValue, setFilterValue] = useState("");

  const filteredData = data.filter((item) => {
    const matchesSearch = columns.some((col) => {
      const value = item[col.key];
      return (
        value &&
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
    const matchesFilter = filterValue
      ? item.status === filterValue || item.type === filterValue
      : true;
    return matchesSearch && matchesFilter;
  });

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="admin-table-card">
      <div className="admin-table-header">
        <h3 className="admin-table-title">
          {columns.length > 0 && data.length > 0 && (
            <span style={{ marginRight: "8px" }}>
              {totalItems} total
            </span>
          )}
        </h3>
        <div className="admin-table-actions">
          <div className="admin-search-input">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="admin-filter-select"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {filteredData.length > 0 ? (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={item.id || index}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                  <td>
                    <div className="admin-actions">
                      {columns[0]?.actions?.map((action, i) => (
                        <button
                          key={i}
                          className={`admin-action-btn admin-action-btn--${action.type}`}
                          onClick={() => action.onClick(item)}
                        >
                          {action.icon}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="admin-pagination">
            <div className="admin-pagination-info">
              Showing {startItem} to {endItem} of {totalItems} results
            </div>
            <div className="admin-pagination-buttons">
              <button
                className="admin-pagination-btn"
                disabled={currentPage === 1}
                onClick={() => onPageChange?.(currentPage - 1)}
              >
                Previous
              </button>
              <button
                className="admin-pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange?.(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="admin-empty-state">
          <div className="admin-empty-state-icon">{emptyState.icon}</div>
          <h3 className="admin-empty-state-title">{emptyState.title}</h3>
          <p className="admin-empty-state-text">{emptyState.text}</p>
        </div>
      )}
    </div>
  );
};

export default DataTable;
