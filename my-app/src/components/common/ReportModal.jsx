import React, { useState } from 'react';
import serviceLocator from '../../utils/serviceLocator';
import './ReportModal.css';

const ReportModal = ({ isOpen, onClose, entityType, entityId }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      setError('Please select a reason.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await serviceLocator.moderation.createReport({
        entity_type: entityType,
        entity_id: entityId,
        reason,
        description
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setReason('');
        setDescription('');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sc-report-modal-overlay" onClick={onClose} data-testid="report-modal">
      <div className="sc-report-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="sc-report-modal-header">
          <h3>Report {entityType}</h3>
          <button className="sc-report-modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="sc-report-modal-body">
          {success ? (
            <div className="sc-report-success-msg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              <p>Report submitted successfully. Our team will review this shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="sc-report-intro">
                Please let us know why you are reporting this {entityType.toLowerCase()}:
              </p>

              {error && <div className="sc-report-error">{error}</div>}

              <div className="sc-report-form-group">
                <label>Reason *</label>
                <select 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a reason...</option>
                  <option value="Copyright">Copyright Infringement</option>
                  <option value="InappropriateContent">Inappropriate Content</option>
                  <option value="Spam">Spam</option>
                  <option value="HateSpeech">Hate Speech</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="sc-report-form-group">
                <label>Additional Details (Optional)</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide any additional context to help us review (Max 500 chars)"
                  maxLength="500"
                  rows="4"
                ></textarea>
                <div className="sc-report-char-count">{description.length}/500</div>
              </div>

              <div className="sc-report-modal-actions">
                <button type="button" className="sc-btn-cancel" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="sc-btn-submit" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportModal;