import React, { useState, useEffect } from 'react';
import styles from './ResultsTable.module.css';
import EditableCell from './EditableCell';

const ResultsTable = ({ data }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [authorBirthDates, setAuthorBirthDates] = useState({});
  const [tableData, setTableData] = useState(data);
  
  const totalPages = Math.ceil(data.length / recordsPerPage);

  useEffect(() => {
    setTableData(data);
  }, [data]);

  const handleChangeRecordsPerPage = (event) => {
    setRecordsPerPage(Number(event.target.value));
    setCurrentPage(1); // Reset to first page whenever records per page change
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const findAuthor = async (id) => {
    let apiUrl = 'https://openlibrary.org/authors/';
    if (id) {
      apiUrl += `${encodeURIComponent(id)}.json`;
    }
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      const data = await response.json();
      return data.birth_date;
    } catch (error) {
      console.error('There has been a problem with your fetch operation:', error);
      return null; // Return null or handle the error appropriately
    }
  };

  useEffect(() => {
    const fetchDataForAllAuthors = async () => {
      const authorIds = data.map((book) => book.author_key[0]);
      const birthDates = {};
      await Promise.all(
        authorIds.map(async (authorId) => {
          const birthDate = await findAuthor(authorId);
          birthDates[authorId] = birthDate;
        })
      );
      setAuthorBirthDates(birthDates);
    };
    fetchDataForAllAuthors();
  }, [data]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...tableData].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const authorTopWorks = new Map();
  const findTop = (title, authorId) => {
    if (!authorTopWorks.has(authorId)) {
      authorTopWorks.set(authorId, title);
    }
    return authorTopWorks.get(authorId);
  };

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = sortedData.slice(indexOfFirstRecord, indexOfLastRecord);

  const convertToCSV = (array) => {
    const headers = ["Author Name", "First Publish Year", "Ratings Average", "Title", "Subject", "Author Birth Date", "Top Work"];
    const rows = array.map(book => [
      book.author_name,
      book.first_publish_year,
      book.ratings_average,
      book.title,
      book.subject ? book.subject[0] : 'N/A',
      authorBirthDates[book.author_key[0]],
      findTop(book.title, book.author_key[0])
    ]);
    return [headers, ...rows].map(row => row.join(",")).join("\n");
  };

  const downloadCSV = () => {
    const csvData = convertToCSV(tableData);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'results.csv';
    link.click();
  };

  const handleEditSave = (rowIndex, columnKey, newValue) => {
    const updatedData = [...tableData];
    updatedData[rowIndex][columnKey] = newValue;
    setTableData(updatedData);
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
  };

  return (
    <div>
      <button onClick={downloadCSV} className={styles.downloadButton}>Download CSV</button>
      <table className={styles.table}>
        <thead>
          <tr>
            <th onClick={() => handleSort('author_name')}>
              Author Name{getSortIndicator('author_name')}
            </th>
            <th onClick={() => handleSort('first_publish_year')}>
              First Publish Year{getSortIndicator('first_publish_year')}
            </th>
            <th onClick={() => handleSort('ratings_average')}>
              Ratings Average{getSortIndicator('ratings_average')}
            </th>
            <th onClick={() => handleSort('title')}>
              Title{getSortIndicator('title')}
            </th>
            <th onClick={() => handleSort('subject')}>
              Subject{getSortIndicator('subject')}
            </th>
            <th>Author Birth Date</th>
            <th>Top Work</th>
          </tr>
        </thead>
        <tbody>
          {currentRecords.map((book, index) => (
            <tr key={index}>
              <EditableCell value={book.author_name} onSave={(newValue) => handleEditSave(index, 'author_name', newValue)} />
              <EditableCell value={book.first_publish_year} onSave={(newValue) => handleEditSave(index, 'first_publish_year', newValue)} />
              <EditableCell value={book.ratings_average} onSave={(newValue) => handleEditSave(index, 'ratings_average', newValue)} />
              <EditableCell value={book.title} onSave={(newValue) => handleEditSave(index, 'title', newValue)} />
              <EditableCell value={book.subject ? book.subject[0] : 'N/A'} onSave={(newValue) => handleEditSave(index, 'subject', newValue)} />
              <td>
                {book.author_key[0] && (
                  <EditableCell value={authorBirthDates[book.author_key[0]]} onSave={(newValue) => handleEditSave(index, 'authorBirthDate', newValue)} />
                )}
              </td>
              <td>
                {findTop(book.title, book.author_key[0])}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.pagination}>
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
        >
          First
        </button>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          Last
        </button>
        <select value={recordsPerPage} onChange={handleChangeRecordsPerPage}>
          <option value={10}>10</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>
  );
};

export default ResultsTable;
