function AddMeetingModal({ onClose }) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <h3>Add Meeting / Service</h3>
  
          <form>
            <input type="text" placeholder="Title" />
            
            <select>
              <option value="">Select Type</option>
              <option>Service</option>
              <option>Meeting</option>
            </select>
  
            <input type="date" />
  
            <input type="number" placeholder="Attendance Count" />
  
            <textarea placeholder="Notes (optional)" />
  
            <div className="modal-actions">
            <button className="cancel-btn" type="button" onClick={onClose}>
                Cancel
              </button>
              <button className="save-btn" type="submit">Save</button>
             
            </div>
          </form>
        </div>
      </div>
    );
  }
  
  export default AddMeetingModal;
  