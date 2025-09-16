import React, { useState, useEffect } from 'react';
import { CustomAlert, CustomToast, useAlert, useToast } from '../components/CustomAlert'
import {
    View,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from 'react-native';
import SQLite from 'react-native-sqlite-storage';
import { ThemedText } from '../ui/ThemedText';
import { Image } from 'react-native';
import taskIllustration from "../assets/illustrations/tasks.png"
import { dbHelper } from '../database';
import type { Task } from '../types';

SQLite.enablePromise(true);
SQLite.DEBUG(true);

type TaskItemProps = { task: Task; onDelete: (id: number) => void };

const TaskItem = ({ task, onDelete }: TaskItemProps) => (

    <View className="flex-row items-center bg-[#efe5d3] rounded-2xl pl-5 pr-2 py-4 shadow-lg shadow-black/10">
        <View
            className="flex-row items-center flex-1"
        >
            <View className="mr-4">
                <View className={`w-6 h-6 rounded-full border-2 justify-center items-center bg-[#2C2C2C] border-[#2C2C2C]
                 `}>
                    <ThemedText className="text-white text-2xl -mt-2 font-bold" style={{ transform: [{ rotate: '360deg' }] }}>
                        ›
                    </ThemedText>
                </View>
            </View>
            <ThemedText className={`text-base flex-1 font-medium text-black`}>
                {task.text}
            </ThemedText>
        </View>

        <TouchableOpacity
            className="w-8 h-8 ml-2 rounded-full bg-gray-100 justify-center items-center"
            onPress={() => onDelete(task.id)}
            activeOpacity={0.7}
        >
            <ThemedText className="text-lg text-gray-500 font-light">−</ThemedText>
        </TouchableOpacity>
    </View>
);

type AddTaskInputProps = { newTaskText: string; setNewTaskText: (text: string) => void; cancelAddTask: () => void; onAddTask: () => void };
const AddTaskInput = ({ newTaskText, setNewTaskText, cancelAddTask, onAddTask }: AddTaskInputProps) => (
    <View className="flex-row items-center bg-[#efe5d3] rounded-3xl pl-5 pr-2 py-2 shadow-lg shadow-black/10 mb-3">
        <View className="mr-4">
            <View className="w-6 h-6 rounded-full border-2 justify-center items-center bg-[#2C2C2C] border-[#2C2C2C]">
                <ThemedText className="text-white text-2xl -mt-2 font-bold" style={{ transform: [{ rotate: '360deg' }] }}>
                    ›
                </ThemedText>
            </View>
        </View>
        <TextInput
            className="text-base flex-1 text-black"
            placeholder="Enter new task..."
            placeholderTextColor="#999"
            value={newTaskText}
            onChangeText={setNewTaskText}
            autoFocus={true}
            multiline={true}
            onSubmitEditing={onAddTask}
            style={{ fontFamily: 'DMSans-SemiBold' }}
        />
        <TouchableOpacity
            className="w-8 h-8 rounded-full bg-gray-100 justify-center items-center ml-2"
            onPress={cancelAddTask}
            activeOpacity={0.7}
        >
            <ThemedText className="text-lg text-gray-500 font-light">×</ThemedText>
        </TouchableOpacity>
    </View>
);

type EmptyStateProps = { onAddTask: () => void };
const EmptyState = ({ onAddTask }: EmptyStateProps) => (
    <View className="flex-1 justify-center items-center px-8">
        <View className="items-center">
            <Image
                source={taskIllustration}
                className="w-[300px] h-[300px]"
                resizeMode="contain"
            />
            <TouchableOpacity
                className="bg-[#fddab1] px-6 py-3 rounded-xl mt-6"
                onPress={onAddTask}
                activeOpacity={0.7}
            >
                <ThemedText className="text-black font-semibold text-base">
                    + Add your first task
                </ThemedText>
            </TouchableOpacity>
        </View>
    </View>

);

const TaskPriorityScreen = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskText, setNewTaskText] = useState('');
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const { alert, showAlert, hideAlert } = useAlert();
    const { toast, hideToast, showToast } = useToast();

    const initializeDatabase = async () => {
        await dbHelper.initializeDatabase();
        await loadTasks();
    };

    useEffect(() => {
        initializeDatabase();
    }, []);

    const loadTasks = async () => {
        try {
            const loaded = await dbHelper.getAllTasks();
            setTasks(loaded);
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveTaskToDatabase = async (taskText: string) => {
        try {
            const saved = await dbHelper.addTask(taskText);
            return saved;
        } catch (error) {
            console.error('Error saving task:', error);
            showAlert('Error', 'Failed to save task', { type: 'error' });
            return null;
        }
    };

    const deleteTaskFromDatabase = async (taskId: number) => {
        try {
            await dbHelper.deleteTask(taskId);
            return true;
        } catch (error) {
            console.error('Error deleting task:', error);
            showAlert('Error', 'Failed to delete task', { type: 'error' });
            return false;
        }
    };

    const handleAddTodo = async () => {
        if (isAddingTask && newTaskText.trim()) {
            const savedTask = await saveTaskToDatabase(newTaskText.trim());
            if (savedTask) {
                Keyboard.dismiss()
                setTasks([savedTask, ...tasks]);
                setNewTaskText('');
                setIsAddingTask(false);
            }
        } else if (isAddingTask && !newTaskText.trim()) {
            showToast('Please enter description!', 'info');
        }
    };

    const deleteTask = async (id: number) => {
        const success = await deleteTaskFromDatabase(id);
        if (success) {
            setTasks(tasks.filter(task => task.id !== id));
        }
    };

    const handleAddButtonPress = () => {
        if (isAddingTask) {
            handleAddTodo();
        } else {
            Keyboard.dismiss();
            setTimeout(() => {
                setIsAddingTask(true);
            }, 100);
        }
    };

    const cancelAddTask = () => {
        setIsAddingTask(false);
        setNewTaskText('');
    };


    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-[#FBF7EF] justify-center items-center">
                <ThemedText className="text-lg text-gray-600">Loading tasks...</ThemedText>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-blue-50">
            <KeyboardAvoidingView
                className='flex-1 bg-[#FBF7EF] px-6'
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View className="flex-1">
                    {tasks.length === 0 && !isAddingTask ? (
                        <>
                            {/* Header */}
                            <View className="mt-10 mb-10 px-5" >
                                <ThemedText className="text-base text-gray-600 mb-2 font-normal">
                                    What's more important than reels?
                                </ThemedText>
                                <ThemedText className="text-3xl text-[#4C4B7E] leading-10" style={{ fontFamily: 'YoungSerif-Regular' }}>
                                    Let's make it a{'\n'}priority.
                                </ThemedText>
                            </View>
                            <EmptyState onAddTask={() => setIsAddingTask(true)} />
                        </>
                    ) : (
                        <ScrollView
                            className="flex-1 px-5"
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Header */}
                            <View className="mt-10 mb-10">
                                <ThemedText className="text-base text-gray-600 mb-2 font-normal">
                                    What's more important than reels?
                                </ThemedText>
                                <ThemedText className="text-3xl text-[#4C4B7E] leading-10" style={{ fontFamily: 'YoungSerif-Regular' }} >
                                    Let's make it a{'\n'}priority.
                                </ThemedText>
                            </View>

                            {/* Add Task Button */}
                            <View className="mb-8">
                                <TouchableOpacity
                                    className="bg-[#fddab1] px-4 py-2 rounded-xl self-start"
                                    onPress={handleAddButtonPress}
                                    activeOpacity={0.7}
                                >
                                    <ThemedText className="text-black font-semibold text-base">
                                        {isAddingTask ? '✓ Add' : '+ Add new task'}
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>

                            {isAddingTask && (
                                <AddTaskInput
                                    newTaskText={newTaskText}
                                    setNewTaskText={setNewTaskText}
                                    cancelAddTask={cancelAddTask}
                                    onAddTask={handleAddTodo}
                                />
                            )}

                            {/* Task List */}
                            <View className="gap-4 mb-10">
                                {tasks.map((task) => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        onDelete={deleteTask}
                                    />
                                ))}
                            </View>
                        </ScrollView>
                    )}

                    {/* {!keyboardVisible && !isAddingTask && tasks.length > 0 && (
                        <View className="px-5 mb-4 mt-4">
                            <CustomButton
                                onPress={handleSaveTasks}
                                title='Save Tasks'
                                className='bg-black'
                            />
                        </View>
                    )} */}
                </View>

                <CustomAlert
                    visible={alert.visible}
                    title={alert.title}
                    message={alert.message}
                    type={alert.type}
                    onConfirm={alert.onConfirm || hideAlert}
                    onCancel={alert.onCancel}
                    confirmText={alert.confirmText}
                    cancelText={alert.cancelText}
                />

                <CustomToast
                    visible={toast.visible}
                    message={toast.message}
                    type={toast.type}
                    onHide={hideToast}
                />

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default TaskPriorityScreen;