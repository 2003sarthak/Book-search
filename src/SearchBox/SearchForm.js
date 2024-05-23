import React, { useState } from 'react';
import styles from './SearchForm.module.css';
import ResultsTable from './ResultsTable';

const SearchForm = () => {
  const [formData, setFormData] = useState({
    author_name: '',
    title: ''
  });
  const [data, setData] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let apiUrl = 'https://openlibrary.org/search.json?';

    // Add author parameter if author_name is not empty
    if (formData.author_name) {
      apiUrl += `author=${encodeURIComponent(formData.author_name)}&`;
    }

    // Add title parameter if title is not empty
    if (formData.title) {
      apiUrl += `title=${encodeURIComponent(formData.title)}&`;
    }

    async function fetchData() {
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
        }
        const data = await response.json();
        console.log(data);
        setData(data.docs); // Assuming data.docs contains the relevant results
      } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
      }
    }
    fetchData();
  };

  return (
    <div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div>
          <label htmlFor="author_name">Author Name:</label>
          <input
            type="text"
            id="author_name"
            name="author_name"
            value={formData.author_name}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
          />
        </div>
        <button type="submit">Submit</button>
      </form>
      <div className={styles.messageBox}>
        <p>To edit a cell, double click on it. After making changes, press Enter to save.</p>
        <p>To sort columns, click on the column header. Click again to toggle between ascending and descending order.</p>
      </div>
      <ResultsTable data={data} />
    </div>
  );
};

export default SearchForm;
