import { useState, useCallback, useEffect } from 'react'; // Add useEffect
import { vectorDBService } from '../../../services/api';

export const useVectorDB = (sessionId) => {
  const [isVectorDBLoading, setIsVectorDBLoading] = useState(false);
  const [retrievedDocs, setRetrievedDocs] = useState([]); // State to hold retrieved docs
  const [isDbInitializedForSession, setIsDbInitializedForSession] = useState(false); // Track initialization per session

  // Reset initialization status when session ID changes
  useEffect(() => {
    setIsDbInitializedForSession(false);
    setRetrievedDocs([]); // Clear docs for new session
  }, [sessionId]);

  // Modified handleInitVectorDB to return success status and set state
  const handleInitVectorDB = useCallback(async () => {
    if (!sessionId) {
      console.warn('Cannot init VectorDB without session ID');
      return false;
    }
    // Avoid re-initializing if already done for this session
    if (isDbInitializedForSession) {
        return true;
    }

    console.log(`Initializing VectorDB for session: ${sessionId}`);
    setIsVectorDBLoading(true);
    setRetrievedDocs([]); // Clear previous results
    try {
      const result = await vectorDBService.initVectorDB(sessionId);
      console.log('VectorDB initialized:', result);
      setIsDbInitializedForSession(true); // Set initialized state
      // TODO: Add user feedback (e.g., toast notification) for success
      return true; // Indicate success
    } catch (error) {
      console.error('Error initializing VectorDB:', error);
      setIsDbInitializedForSession(false); // Ensure it's false on error
      // TODO: Add user feedback for error
      return false; // Indicate failure
    } finally {
      // Keep loading true if subsequent action depends on this,
      // otherwise set to false if init is the only action.
      // For now, let the calling function manage the final loading state.
      // setIsVectorDBLoading(false);
    }
  }, [sessionId, isDbInitializedForSession]); // Add isDbInitializedForSession dependency

  const handleAddDocuments = useCallback(async (document, document_id = null, chunk_size = 1000, chunk_overlap = 200, type = 'txt') => {
    if (!sessionId || !document) {
       console.warn('Cannot add document without session ID or document content');
       return false; // Indicate failure
    }

    setIsVectorDBLoading(true);
    setRetrievedDocs([]); // Clear previous results

    try {
      // Ensure DB is initialized first
      const initialized = await handleInitVectorDB();
      if (!initialized) {
        console.error('Failed to initialize DB before adding document.');
        // TODO: Add user feedback for initialization failure
        return false;
      }

      // Proceed with adding document
      const result = await vectorDBService.addDocuments(sessionId, document, document_id, chunk_size, chunk_overlap, type);
      console.log('Documents added:', result);
      // TODO: Add user feedback for success
      return true; // Indicate success of add operation
    } catch (error) {
      console.error('Error adding documents:', error);
      // TODO: Add user feedback for error
      return false; // Indicate failure of add operation
    } finally {
      setIsVectorDBLoading(false); // Set loading false after add attempt
    }
  }, [sessionId, handleInitVectorDB]); // Add handleInitVectorDB dependency

  const handleRetrieveDocuments = useCallback(async (query, n_results = 5) => {
    if (!sessionId || !query) {
      console.warn('Cannot retrieve documents without session ID or query');
      setRetrievedDocs([]);
      return null;
    }

    setIsVectorDBLoading(true);
    setRetrievedDocs([]); // Clear previous results before new retrieval

    try {
       // Ensure DB is initialized first
      const initialized = await handleInitVectorDB();
       if (!initialized) {
        console.error('Failed to initialize DB before retrieving documents.');
        // TODO: Add user feedback for initialization failure
        return null;
      }

      // Proceed with retrieving documents
      const result = await vectorDBService.retrieveDocuments(sessionId, query, n_results);
      console.log('Documents retrieved:', result);
      if (result && result.results) {
        setRetrievedDocs(result.results); // Store retrieved docs
        // TODO: Add user feedback for success
        return result.results;
      }
       // TODO: Add user feedback if no results found but request was successful
      return null;
    } catch (error) {
      console.error('Error retrieving documents:', error);
      setRetrievedDocs([]); // Clear on error
      // TODO: Add user feedback for error
      return null;
    } finally {
      setIsVectorDBLoading(false); // Set loading false after retrieve attempt
    }
  }, [sessionId, handleInitVectorDB]); // Add handleInitVectorDB dependency

  const handleDeleteCollection = useCallback(async () => {
    if (!sessionId) {
       console.warn('Cannot delete collection without session ID');
       return;
    }
    // Consider adding a confirmation dialog here in the UI component that calls this
    setIsVectorDBLoading(true);
    setRetrievedDocs([]); // Clear previous results
    try {
      const result = await vectorDBService.deleteCollection(sessionId);
      console.log('VectorDB collection deleted:', result);
      // TODO: Add user feedback for success
    } catch (error) {
      console.error('Error deleting collection:', error);
      // TODO: Add user feedback for error
    } finally {
      setIsVectorDBLoading(false);
    }
  }, [sessionId]);

  return {
    isVectorDBLoading,
    retrievedDocs,
    handleInitVectorDB,
    handleAddDocuments,
    handleRetrieveDocuments,
    handleDeleteCollection,
  };
};
