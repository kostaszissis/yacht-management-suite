// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "test-api-key-123456789",
  authDomain: "test-project.firebaseapp.com",
  projectId: "test-project-2024",
  storageBucket: "test-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Interfaces για TypeScript
export interface BookingData {
  bookingNumber: string;
  vesselCategory: string;
  vesselName: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  skipperFirstName: string;
  skipperLastName: string;
  skipperAddress: string;
  skipperEmail: string;
  skipperPhone: string;
  equipment: any[];
  damages: any[];
  totalDamages: number;
  photos: any[];
  notes: any;
  signatures: any;
  status: 'checkin' | 'checkout' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  checkInCompleted?: boolean;
  checkOutCompleted?: boolean;
}

// Anonymous authentication
export const authenticateUser = async () => {
  try {
    await signInAnonymously(auth);
    console.log('Authenticated successfully');
    return true;
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
};

// Save booking
export const saveBooking = async (bookingNumber: string, data: Partial<BookingData>) => {
  try {
    const docRef = doc(db, 'bookings', bookingNumber);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });
      console.log('Booking updated:', bookingNumber);
    } else {
      await setDoc(docRef, {
        ...data,
        status: 'checkin',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('New booking created:', bookingNumber);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving booking:', error);
    return false;
  }
};

// Get booking
export const getBooking = async (bookingNumber: string): Promise<BookingData | null> => {
  try {
    const docRef = doc(db, 'bookings', bookingNumber);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as BookingData;
    } else {
      console.log('No booking found with number:', bookingNumber);
      return null;
    }
  } catch (error) {
    console.error('Error getting booking:', error);
    return null;
  }
};

// Complete check-in
export const completeCheckIn = async (bookingNumber: string) => {
  try {
    const docRef = doc(db, 'bookings', bookingNumber);
    await updateDoc(docRef, {
      checkInCompleted: true,
      status: 'checkin',
      checkInTimestamp: new Date().toISOString(),
      updatedAt: new Date()
    });
    console.log('Check-in completed for:', bookingNumber);
    return true;
  } catch (error) {
    console.error('Error completing check-in:', error);
    return false;
  }
};

// Complete check-out
export const completeCheckOut = async (bookingNumber: string, damages: any[], totalDamages: number) => {
  try {
    const docRef = doc(db, 'bookings', bookingNumber);
    await updateDoc(docRef, {
      checkOutCompleted: true,
      status: 'completed',
      checkOutTimestamp: new Date().toISOString(),
      damages: damages,
      totalDamages: totalDamages,
      updatedAt: new Date()
    });
    console.log('Check-out completed for:', bookingNumber);
    return true;
  } catch (error) {
    console.error('Error completing check-out:', error);
    return false;
  }
};

// Upload photo
export const uploadPhoto = async (bookingNumber: string, photoData: string, photoName: string) => {
  try {
    const storageRef = ref(storage, `bookings/${bookingNumber}/${photoName}`);
    const snapshot = await uploadString(storageRef, photoData, 'data_url');
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('Photo uploaded:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading photo:', error);
    return null;
  }
};

// Save signature
export const saveSignature = async (bookingNumber: string, signatureData: string, type: 'checkin' | 'checkout') => {
  try {
    const fileName = `signature_${type}_${Date.now()}.png`;
    const url = await uploadPhoto(bookingNumber, signatureData, fileName);
    
    if (url) {
      const docRef = doc(db, 'bookings', bookingNumber);
      const updateData = type === 'checkin' 
        ? { checkInSignature: url }
        : { checkOutSignature: url };
      
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date()
      });
      
      console.log(`${type} signature saved`);
      return url;
    }
    return null;
  } catch (error) {
    console.error('Error saving signature:', error);
    return null;
  }
};

export default app;