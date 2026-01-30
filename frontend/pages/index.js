import { useEffect, useState } from "react";

const ART_LINK = (id) => `https://www.artic.edu/artworks/${id}`;

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [places, setPlaces] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Project being edited (click "Edit" on a project)
  const [editingProject, setEditingProject] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [newPlaceId, setNewPlaceId] = useState("");
  const [newPlaceNotes, setNewPlaceNotes] = useState("");
  const [saving, setSaving] = useState(false);

  function loadProjects() {
    setLoading(true);
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        setProjects(data);
        setError("");
      })
      .catch(() => setError("Could not load projects"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProjects();
  }, []);

  function openEdit(project) {
    setEditingProject(project);
    setEditName(project.name);
    setEditDescription(project.description || "");
    setEditStartDate(project.start_date || "");
    setNewPlaceId("");
    setNewPlaceNotes("");
    setError("");
  }

  function closeEdit() {
    setEditingProject(null);
    setError("");
  }

  async function saveProject(e) {
    e.preventDefault();
    if (!editingProject) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/projects/" + editingProject.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
          start_date: editStartDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Could not save");
        setSaving(false);
        return;
      }
      loadProjects();
      setEditingProject(data);
      setSaving(false);
    } catch (err) {
      setError("Could not save project");
      setSaving(false);
    }
  }

  async function deleteProject() {
    if (!editingProject) return;
    if (!confirm("Delete this project? You cannot delete it if any place is marked visited.")) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/projects/" + editingProject.id, { method: "DELETE" });
      if (res.status === 204) {
        loadProjects();
        closeEdit();
      } else {
        const data = await res.json();
        setError(data.detail || "Could not delete (e.g. project has visited places)");
      }
      setSaving(false);
    } catch (err) {
      setError("Could not delete project");
      setSaving(false);
    }
  }

  async function savePlace(place) {
    if (!editingProject) return;
    setError("");
    try {
      const res = await fetch("/api/projects/" + editingProject.id + "/places/" + place.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: place.notes || null, visited: place.visited }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Could not save place");
        return;
      }
      const updatedProject = { ...editingProject, places: (editingProject.places || []).map((p) => (p.id === place.id ? data : p)) };
      setEditingProject(updatedProject);
      loadProjects();
    } catch (err) {
      setError("Could not save place");
    }
  }

  async function addPlaceToProject(e) {
    e.preventDefault();
    if (!editingProject) return;
    const id = newPlaceId.trim();
    if (!id || isNaN(Number(id))) {
      setError("Enter a valid artwork ID (number)");
      return;
    }
    if ((editingProject.places || []).length >= 10) {
      setError("Maximum 10 places per project");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/projects/" + editingProject.id + "/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ external_id: Number(id), notes: newPlaceNotes.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Could not add place");
        setSaving(false);
        return;
      }
      setEditingProject({ ...editingProject, places: [...(editingProject.places || []), data] });
      setNewPlaceId("");
      setNewPlaceNotes("");
      loadProjects();
      setSaving(false);
    } catch (err) {
      setError("Could not add place");
      setSaving(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchResults([]);
    fetch("/api/search-art?q=" + encodeURIComponent(searchQuery.trim()))
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data.data) ? data.data : [];
        setSearchResults(list);
      })
      .catch(() => setSearchResults([]))
      .finally(() => setSearchLoading(false));
  }

  function addPlaceFromSearch(artwork) {
    const id = artwork.id;
    if (places.some((p) => Number(p.external_id) === id)) return;
    if (places.length >= 10) {
      setError("Maximum 10 places per project.");
      return;
    }
    setPlaces([...places, { external_id: String(id), notes: "" }]);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Please enter a project name");
      return;
    }

    const body = {
      name: name.trim(),
      description: description.trim() || null,
      start_date: startDate || null,
    };
    const validPlaces = places.filter((p) => p.external_id !== "" && !isNaN(Number(p.external_id)));
    if (validPlaces.length > 0) {
      body.places = validPlaces.map((p) => ({
        external_id: Number(p.external_id),
        notes: (p.notes || "").trim() || null,
      }));
    }

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Could not create project");
        return;
      }
      setProjects([...projects, data]);
      setName("");
      setDescription("");
      setStartDate("");
      setPlaces([]);
    } catch (err) {
      setError("Could not create project");
    }
  }

  function addPlace() {
    if (places.length >= 10) {
      setError("Maximum 10 places per project.");
      return;
    }
    setPlaces([...places, { external_id: "", notes: "" }]);
    setError("");
  }

  function removePlace(i) {
    setPlaces(places.filter((_, index) => index !== i));
  }

  function changePlace(i, field, value) {
    const next = [...places];
    next[i] = { ...next[i], [field]: value };
    setPlaces(next);
  }

  function updateEditPlace(placeId, field, value) {
    if (!editingProject) return;
    const nextPlaces = (editingProject.places || []).map((p) =>
      p.id === placeId ? { ...p, [field]: value } : p
    );
    setEditingProject({ ...editingProject, places: nextPlaces });
  }

  return (
    <div style={{ padding: 20, maxWidth: 640, margin: "0 auto" }}>
      <h1>Travel Projects</h1>
      <p style={{ color: "#555", fontSize: 14, marginBottom: 20 }}>
        Plan trips and collect places from the Art Institute of Chicago. Search for artworks, create projects, then click a project to edit it.
      </p>

      {error && <p style={{ color: "red", marginBottom: 10 }}>{error}</p>}

      {/* Edit project panel */}
      {editingProject && (
        <section style={{ marginBottom: 24, padding: 16, border: "2px solid #333", borderRadius: 8, backgroundColor: "#f5f5f5" }}>
          <h2 style={{ marginTop: 0 }}>Edit: {editingProject.name}</h2>
          <form onSubmit={saveProject}>
            <div style={{ marginBottom: 10 }}>
              <label>Name *</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{ display: "block", marginTop: 4, padding: 8, width: "100%", maxWidth: 400 }}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label>Description</label>
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                style={{ display: "block", marginTop: 4, padding: 8, width: "100%", maxWidth: 400 }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Start date</label>
              <input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                style={{ display: "block", marginTop: 4, padding: 8 }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="submit" disabled={saving} style={{ padding: 8 }}>Save project</button>
              <button type="button" onClick={closeEdit} style={{ padding: 8 }}>Cancel</button>
              <button type="button" onClick={deleteProject} disabled={saving} style={{ padding: 8, color: "crimson" }}>Delete project</button>
            </div>
          </form>

          <h3 style={{ marginTop: 20, marginBottom: 8 }}>Places in this project</h3>
          {(editingProject.places || []).length === 0 ? (
            <p style={{ fontSize: 14, color: "#666" }}>No places yet. Add one below.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, marginBottom: 16 }}>
              {(editingProject.places || []).map((place) => (
                <li key={place.id} style={{ marginBottom: 12, padding: 10, background: "#fff", borderRadius: 6, border: "1px solid #ddd" }}>
                  <div style={{ marginBottom: 6 }}>
                    <strong>Place ID {place.external_id}</strong>
                    {" · "}
                    <a href={ART_LINK(place.external_id)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>View on Art Institute</a>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                    <input
                      type="text"
                      placeholder="Notes"
                      value={place.notes || ""}
                      onChange={(e) => updateEditPlace(place.id, "notes", e.target.value)}
                      style={{ padding: 6, flex: 1, minWidth: 150 }}
                    />
                    <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input
                        type="checkbox"
                        checked={place.visited || false}
                        onChange={(e) => updateEditPlace(place.id, "visited", e.target.checked)}
                      />
                      Visited
                    </label>
                    <button type="button" onClick={() => savePlace(place)} style={{ padding: 6 }}>Save place</button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {(editingProject.places || []).length < 10 && (
            <form onSubmit={addPlaceToProject} style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #ccc" }}>
              <h4 style={{ marginTop: 0 }}>Add a place</h4>
              <p style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>Enter an artwork ID from the Art Institute (search at the top to find IDs).</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="number"
                  placeholder="Artwork ID"
                  value={newPlaceId}
                  onChange={(e) => setNewPlaceId(e.target.value)}
                  style={{ padding: 6, width: 100 }}
                />
                <input
                  type="text"
                  placeholder="Notes"
                  value={newPlaceNotes}
                  onChange={(e) => setNewPlaceNotes(e.target.value)}
                  style={{ padding: 6, width: 150 }}
                />
                <button type="submit" disabled={saving} style={{ padding: 6 }}>Add place</button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* Discover places */}
      <section style={{ marginBottom: 24, padding: 16, border: "1px solid #ddd", borderRadius: 8, backgroundColor: "#fafafa" }}>
        <h2 style={{ marginTop: 0 }}>Find places (Art Institute of Chicago)</h2>
        <p style={{ fontSize: 14, color: "#666", marginBottom: 10 }}>
          Search for artworks. Click &quot;Add to project&quot; to use one in a new project below.
        </p>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g. Monet, landscape"
            style={{ flex: 1, padding: 8 }}
          />
          <button type="submit" style={{ padding: "8px 16px" }} disabled={searchLoading}>
            {searchLoading ? "Searching..." : "Search"}
          </button>
        </form>
        {searchResults.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {searchResults.map((item) => (
              <li key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee", gap: 12 }}>
                <span style={{ flex: 1, fontSize: 14 }}>
                  <strong>{item.title || "Untitled"}</strong>
                  <span style={{ color: "#666", marginLeft: 8 }}>ID: {item.id}</span>
                </span>
                <a href={ART_LINK(item.id)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>View</a>
                <button type="button" onClick={() => addPlaceFromSearch(item)} style={{ padding: "4px 10px", fontSize: 13 }}>Add to project</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* New project form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: 30 }}>
        <h2>New project</h2>
        <div style={{ marginBottom: 10 }}>
          <label>Name *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" style={{ display: "block", marginTop: 4, padding: 8, width: "100%", maxWidth: 400 }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Description (optional)</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" style={{ display: "block", marginTop: 4, padding: 8, width: "100%", maxWidth: 400 }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Start date (optional)</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ display: "block", marginTop: 4, padding: 8 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Places (optional, max 10)</label>
          <p style={{ fontSize: 13, color: "#666", margin: "4px 0 8px 0" }}>Use &quot;Add to project&quot; in search above, or add a row and enter an artwork ID.</p>
          <button type="button" onClick={addPlace} style={{ marginBottom: 8, padding: 6 }}>+ Add place row</button>
          {places.map((p, i) => (
            <div key={i} style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input type="number" placeholder="Artwork ID" value={p.external_id} onChange={(e) => changePlace(i, "external_id", e.target.value)} style={{ padding: 6, width: 90 }} />
              <input type="text" placeholder="Notes" value={p.notes} onChange={(e) => changePlace(i, "notes", e.target.value)} style={{ padding: 6, flex: 1, minWidth: 120 }} />
              <a href={p.external_id ? ART_LINK(p.external_id) : "#"} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>{p.external_id ? "View on Art Institute" : ""}</a>
              <button type="button" onClick={() => removePlace(i)} style={{ padding: 6 }}>Remove</button>
            </div>
          ))}
        </div>
        <button type="submit" style={{ padding: 10, marginTop: 8 }}>Create project</button>
      </form>

      {/* List of projects */}
      <h2>All projects</h2>
      {loading ? (
        <p>Loading...</p>
      ) : projects.length === 0 ? (
        <p>No projects yet. Create one above, then click it to edit.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {projects.map((project) => (
            <li
              key={project.id}
              style={{
                border: "1px solid #ccc",
                padding: 16,
                marginBottom: 12,
                borderRadius: 8,
                backgroundColor: editingProject && editingProject.id === project.id ? "#e8f4f8" : undefined,
              }}
            >
              <strong>{project.name}</strong>
              {project.description && <p style={{ margin: "6px 0 0 0", fontSize: 14, color: "#555" }}>{project.description}</p>}
              {project.start_date && <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "#555" }}>Start: {project.start_date}</p>}
              <span style={{ fontSize: 12, color: project.completed ? "green" : "#888", display: "block", marginTop: 6 }}>
                {project.completed ? "Completed" : "In progress"}
              </span>
              <button type="button" onClick={() => openEdit(project)} style={{ marginTop: 10, padding: "6px 12px", cursor: "pointer" }}>Edit project</button>
              {project.places && project.places.length > 0 && (
                <ul style={{ marginTop: 10, paddingLeft: 20, fontSize: 14 }}>
                  {project.places.map((place) => (
                    <li key={place.id} style={{ marginBottom: 4 }}>
                      Place ID {place.external_id}
                      {place.notes ? " – " + place.notes : ""}
                      {place.visited ? " ✓ visited" : ""}
                      {" · "}
                      <a href={ART_LINK(place.external_id)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>View on Art Institute</a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
